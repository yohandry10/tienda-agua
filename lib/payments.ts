import { database } from "@/lib/orders";
import { paymentConfig } from "@/lib/izipay-config";
import { signPayment, verifyPayment, gatewayState, type PaymentFields } from "@/lib/izipay-signature";

export const PAYMENT_ACTION = "https://secure.micuentaweb.pe/vads-payment/";
export type PaymentAttempt = { id: string; order_id: string; mode: string; token: string; trans_id: string; trans_date: string; amount: number; state: string; gateway_status: string | null; gateway_uuid: string | null };
type PaymentOrder = { id: string; total: number; name: string; phone: string; address: string; district: string; email: string; payment_mode: string };
export function resultUrl(token: string) { return "/pago?token=" + encodeURIComponent(token); }

export async function preparePayment(orderId: string) {
  const config = paymentConfig();
  const db = database();
  const order = await db.prepare("SELECT id,total,name,phone,address,district,email,payment_mode FROM orders WHERE id = ?").bind(orderId).first<PaymentOrder>();
  if (!order || order.payment_mode !== config.mode || !order.email) throw new Error("Invalid payment order");
  let attempt = await db.prepare("SELECT * FROM payment_attempts WHERE order_id = ? AND mode = ? AND state IN ('pendiente','autorizado','pagado') LIMIT 1").bind(orderId, config.mode).first<PaymentAttempt>();
  if (!attempt) {
    for (let retry = 0; retry < 8 && !attempt; retry++) {
      const now = new Date().toISOString();
      const date = now.replace(/\D/g, "").slice(0, 14);
      const transId = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
      const token = crypto.randomUUID();
      await db.prepare("INSERT INTO payment_attempts (id,order_id,mode,token,trans_id,trans_date,trans_day,amount,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING")
        .bind(crypto.randomUUID(), orderId, config.mode, token, transId, date, date.slice(0, 8), order.total, now, now).run();
      attempt = await db.prepare("SELECT * FROM payment_attempts WHERE order_id = ? AND mode = ? AND state IN ('pendiente','autorizado','pagado') LIMIT 1").bind(orderId, config.mode).first<PaymentAttempt>();
    }
  }
  if (!attempt) throw new Error("Payment unavailable");
  if (attempt.state !== "pendiente") return { redirect: resultUrl(attempt.token) };
  const returnUrl = config.origin + "/api/payments/return?token=" + attempt.token;
  const fields: PaymentFields = {
    vads_site_id: config.siteId, vads_ctx_mode: config.mode,
    vads_trans_id: attempt.trans_id, vads_trans_date: attempt.trans_date,
    vads_amount: String(order.total), vads_currency: "604", vads_action_mode: "INTERACTIVE",
    vads_page_action: "PAYMENT", vads_version: "V2", vads_payment_config: "SINGLE",
    vads_order_id: order.id, vads_language: "es", vads_url_check: config.origin + "/api/payments/ipn", vads_cust_name: order.name,
    vads_cust_email: order.email, vads_cust_cell_phone: order.phone,
    vads_cust_address: order.address, vads_cust_city: "Lima", vads_cust_state: "Lima", vads_cust_country: "PE",
    vads_return_mode: "POST", vads_url_return: returnUrl, vads_url_success: returnUrl,
    vads_url_refused: returnUrl, vads_url_cancel: returnUrl, vads_url_error: returnUrl,
    vads_redirect_success_timeout: "5", vads_redirect_error_timeout: "5",
    vads_redirect_success_message: "Volviendo a VAIYO para confirmar tu pedido…",
    vads_redirect_error_message: "Volviendo a VAIYO para revisar tu pago…"
  };
  fields.signature = await signPayment(fields, config.key);
  return { action: PAYMENT_ACTION, fields, token: attempt.token, mode: config.mode, id: order.id, total: order.total };
}

export async function validatedAttempt(fields: PaymentFields) {
  const config = paymentConfig();
  if (fields.vads_ctx_mode !== config.mode || fields.vads_site_id !== config.siteId || !await verifyPayment(fields, config.key)) return null;
  if (!/^\d{1,12}$/.test(fields.vads_amount ?? "") || fields.vads_currency !== "604") return null;
  const attempt = await database().prepare("SELECT * FROM payment_attempts WHERE order_id = ? AND mode = ? AND trans_id = ? AND trans_date = ?")
    .bind(fields.vads_order_id ?? "", config.mode, fields.vads_trans_id ?? "", fields.vads_trans_date ?? "").first<PaymentAttempt>();
  if (!attempt || attempt.amount !== Number(fields.vads_amount)) return null;
  if (attempt.gateway_uuid && fields.vads_trans_uuid && attempt.gateway_uuid !== fields.vads_trans_uuid) return null;
  return attempt;
}

export async function recordNotification(fields: PaymentFields) {
  if (!["PAY", "BO", "MERCH_BO", "BATCH", "BATCH_AUTO"].includes(fields.vads_url_check_src ?? "") || fields.vads_operation_type !== "DEBIT") return false;
  const attempt = await validatedAttempt(fields);
  if (!attempt) return false;
  const state = gatewayState(fields.vads_trans_status ?? "");
  if ((state === "pagado" || state === "autorizado") && (fields.vads_result !== "0" || !fields.vads_trans_uuid)) return false;
  const now = new Date().toISOString();
  const db = database();
  await db.batch([
    db.prepare("UPDATE payment_attempts SET state = ?, gateway_status = ?, gateway_uuid = COALESCE(gateway_uuid,?), updated_at = ? WHERE id = ? AND state != 'cancelado' AND (state != 'pagado' OR (? = 'CANCELLED' AND ? IN ('MERCH_BO','BO','BATCH'))) AND (state != 'autorizado' OR ? IN ('pagado','autorizado') OR ? IN ('CAPTURE_FAILED','EXPIRED','CANCELLED'))")
      .bind(state, fields.vads_trans_status ?? "", fields.vads_trans_uuid || null, now, attempt.id, fields.vads_trans_status ?? "", fields.vads_url_check_src, state, fields.vads_trans_status ?? ""),
    db.prepare("UPDATE orders SET payment_status = COALESCE((SELECT state FROM payment_attempts WHERE order_id = orders.id AND state IN ('autorizado','pagado') ORDER BY CASE state WHEN 'pagado' THEN 0 ELSE 1 END LIMIT 1),(SELECT state FROM payment_attempts WHERE order_id = orders.id ORDER BY created_at DESC,id DESC LIMIT 1),'pendiente'), status = CASE WHEN payment_mode = 'PRODUCTION' AND status = 'pendiente' AND EXISTS(SELECT 1 FROM payment_attempts WHERE order_id = orders.id AND state IN ('autorizado','pagado')) THEN 'confirmado' ELSE status END, updated_at = ? WHERE id = ?")
      .bind(now, attempt.order_id)
  ]);
  return true;
}
