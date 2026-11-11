import { env } from "cloudflare:workers";
import { database } from "@/lib/orders";
import { money, whatsapp } from "@/lib/catalog";
import type { PaymentFields } from "@/lib/izipay-signature";
import { EMAIL_LOGO_BASE64 } from "@/lib/email-logo";

const SALES_EMAIL = "clientesc@aguavaiyo.com";
const FROM = "VAIYO <pedidos@aguavaiyo.com>";
const LOGO = "cid:vaiyo-logo";
type MailOrder = { id: string; name: string; phone: string; email: string | null; address: string; district: string; kind: string; ruc: string | null; receipt: string | null; dni: string | null; business_name: string | null; payment: string; payment_status: string; notes: string; items: string; total: number; created_at: string };
type Row = [string, string];

const pending: Record<string, string> = {
  "Yape o Plin": "PENDIENTE — el cliente enviará el voucher de Yape o Plin por WhatsApp.",
  "Transferencia": "PENDIENTE — el cliente enviará el comprobante de transferencia por WhatsApp.",
  "Efectivo al recibir": "PENDIENTE — pago en efectivo al recibir."
};
const customerPayment: Record<string, string> = {
  "Yape o Plin": "Envíanos por WhatsApp la captura de tu Yape o Plin para confirmar tu pedido.",
  "Transferencia": "Envíanos por WhatsApp el comprobante de tu transferencia para confirmar tu pedido.",
  "Efectivo al recibir": "Pagas en efectivo al recibir tu pedido."
};
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const gatewayDate = (value = "") => /^\d{14}$/.test(value) ? value.slice(6, 8) + "/" + value.slice(4, 6) + "/" + value.slice(0, 4) + " " + value.slice(8, 10) + ":" + value.slice(10, 12) + " UTC" : value;
const limaDate = (iso: string) => new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });

// Branded, printable (600px, A4-friendly) e-mail built from titled sections of label/value rows.
function layout(title: string, intro: string, sections: [string, Row[]][], items: MailOrder) {
  const font = "font-family:Arial,Helvetica,sans-serif;";
  const section = ([heading, rows]: [string, Row[]]) => "<tr><td style=\"padding:18px 32px 0\"><p style=\"" + font + "margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#1a56db\">" + escape(heading) + "</p><table role=\"presentation\" width=\"100%\" style=\"border-collapse:collapse\">"
    + rows.map(([label, value]) => "<tr><td style=\"" + font + "padding:5px 12px 5px 0;font-size:14px;color:#4b5f7c;vertical-align:top;width:42%\">" + escape(label) + "</td><td style=\"" + font + "padding:5px 0;font-size:14px;color:#062c64;font-weight:600\">" + escape(value) + "</td></tr>").join("") + "</table></td></tr>";
  const products = (JSON.parse(items.items) as { name: string; qty: number; price: number }[]).map(item => "<tr><td style=\"" + font + "padding:8px 0;font-size:14px;color:#062c64;border-bottom:1px solid #e3edf9\">" + item.qty + " × " + escape(item.name) + "</td><td style=\"" + font + "padding:8px 0;font-size:14px;color:#4b5f7c;text-align:right;border-bottom:1px solid #e3edf9\">" + money(item.price) + " c/u</td><td style=\"" + font + "padding:8px 0;font-size:14px;color:#062c64;font-weight:600;text-align:right;border-bottom:1px solid #e3edf9\">" + money(item.price * item.qty) + "</td></tr>").join("");
  return "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:24px 0;background:#f1f6fc\"><table role=\"presentation\" width=\"600\" align=\"center\" style=\"max-width:600px;width:100%;background:#ffffff;border-collapse:collapse;border:1px solid #dbe6f4\">"
    + "<tr><td style=\"padding:28px 32px 8px;text-align:center\"><img src=\"" + LOGO + "\" width=\"180\" height=\"131\" alt=\"VAIYO Alkaline Water\" style=\"display:inline-block;border:0\"></td></tr>"
    + "<tr><td style=\"padding:8px 32px 0\"><h1 style=\"" + font + "margin:0;font-size:22px;color:#062c64\">" + escape(title) + "</h1><p style=\"" + font + "margin:8px 0 0;font-size:14px;line-height:1.5;color:#4b5f7c\">" + escape(intro) + "</p></td></tr>"
    + sections.map(section).join("")
    + "<tr><td style=\"padding:18px 32px 0\"><p style=\"" + font + "margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#1a56db\">Productos</p><table role=\"presentation\" width=\"100%\" style=\"border-collapse:collapse\">" + products
    + "<tr><td colspan=\"2\" style=\"" + font + "padding:12px 0 0;font-size:16px;font-weight:700;color:#062c64\">Total</td><td style=\"" + font + "padding:12px 0 0;font-size:18px;font-weight:700;color:#062c64;text-align:right\">" + money(items.total) + "</td></tr></table></td></tr>"
    + "<tr><td style=\"padding:28px 32px;" + font + "font-size:12px;line-height:1.5;color:#6b7f99;text-align:center\">VAIYO · Agua alcalina y ozonizada · Lima · WhatsApp 967 232 782 · aguavaiyo.com</td></tr></table></body></html>";
}

function receiptRows(order: MailOrder): Row[] {
  const rows: Row[] = [["Comprobante", order.receipt ?? "Boleta"]];
  if (order.receipt === "Factura") rows.push(["RUC", order.ruc ?? "—"], ["Razón social", order.business_name ?? "—"]);
  else rows.push(["DNI", order.dni ?? "Sin DNI"], ["A nombre de", order.name]);
  return rows;
}

async function send(apiKey: string, key: string, message: object) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ ...message, attachments: [{ filename: "vaiyo-logo.jpg", content: EMAIL_LOGO_BASE64, content_id: "vaiyo-logo" }] })
  });
  if (!response.ok) throw new Error("Resend " + response.status + ": " + (await response.text()).slice(0, 200));
}

// One e-mail per web order to sales (with the data to issue the boleta/factura in SUNAT) and, when given, a confirmation to the customer.
// Offline payments are sent at registration; card payments when Izipay approves them.
export async function notifySales(orderId: string, payment?: PaymentFields) {
  const apiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!apiKey) return;
  const db = database();
  const claim = await db.prepare("UPDATE orders SET notified_at = ? WHERE id = ? AND notified_at IS NULL").bind(new Date().toISOString(), orderId).run();
  if (!claim.meta.changes) return;
  const order = await db.prepare("SELECT id,name,phone,email,address,district,kind,ruc,receipt,dni,business_name,payment,payment_status,notes,items,total,created_at FROM orders WHERE id = ?").bind(orderId).first<MailOrder>();
  if (!order) return;
  const paid = Boolean(payment) || ["autorizado", "pagado"].includes(order.payment_status);
  const paymentRows: Row[] = [["Método", order.payment], ["Estado", paid ? "PAGADO con tarjeta (Izipay)" : pending[order.payment] ?? "PENDIENTE"]];
  if (payment) paymentRows.push(
    ["Transacción Izipay", payment.vads_trans_uuid ?? ""], ["N.° de autorización", payment.vads_auth_number ?? ""],
    ["Tarjeta", [payment.vads_card_brand, payment.vads_card_number].filter(Boolean).join(" ")], ["Fecha del pago", gatewayDate(payment.vads_effective_creation_date ?? payment.vads_trans_date)],
    ["Importe pagado", money(Number(payment.vads_amount))]
  );
  const delivery: Row[] = [["Pedido para", order.kind], ["Distrito", order.district], ["Dirección", order.address], ["Referencia", order.notes || "—"]];
  try {
    const title = "Pedido web " + order.id;
    await send(apiKey, "vaiyo-order-" + order.id, {
      from: FROM, to: [SALES_EMAIL], ...(order.email ? { reply_to: order.email } : {}),
      subject: title + " · " + (paid ? "PAGADO" : "Pago pendiente") + " · " + money(order.total) + " · " + (order.receipt ?? "Boleta"),
      html: layout(title, "Emite el comprobante en SUNAT con estos datos. Registrado el " + limaDate(order.created_at), [
        ["Datos para emitir en SUNAT", [...receiptRows(order), ["Correo del cliente", order.email ?? "No indicó"], ["Total a facturar", money(order.total)]]],
        ["Pago", paymentRows],
        ["Cliente", [["Nombre", order.name], ["WhatsApp", order.phone]]],
        ["Entrega", delivery]
      ], order),
      text: [title, ...receiptRows(order), ...paymentRows, ["Cliente", order.name], ["WhatsApp", order.phone], ...delivery, ["Total", money(order.total)]].map(row => Array.isArray(row) ? row.join(": ") : row).join("\n")
    });
  } catch (error) {
    // Release the claim so a later event can retry the e-mail.
    await db.prepare("UPDATE orders SET notified_at = NULL WHERE id = ?").bind(orderId).run();
    console.error("Sales e-mail failed", orderId, error instanceof Error ? error.message : "unknown");
    return;
  }
  if (!order.email) return;
  try {
    await send(apiKey, "vaiyo-customer-" + order.id, {
      from: FROM, to: [order.email], reply_to: SALES_EMAIL,
      subject: "Tu pedido VAIYO " + order.id + (paid ? " · Pago aprobado" : " · Recibido"),
      html: layout("¡Gracias, " + order.name.split(" ")[0] + "!", (paid ? "Tu pago fue aprobado. " : "Recibimos tu pedido. ") + "Te enviaremos tu " + (order.receipt ?? "boleta").toLowerCase() + " electrónica a este correo o por WhatsApp. Coordinaremos la entrega contigo al " + order.phone + ".", [
        ["Tu pedido", [["Número", order.id], ["Fecha", limaDate(order.created_at)]]],
        ["Comprobante", receiptRows(order)],
        ["Pago", paid ? [["Estado", "Aprobado con tarjeta"], ...(payment ? [["N.° de autorización", payment.vads_auth_number ?? ""] as Row] : [])] : [["Método", order.payment], ["Siguiente paso", customerPayment[order.payment] ?? "Te contactaremos por WhatsApp."]]],
        ["Entrega", delivery]
      ], order),
      text: "Gracias por tu pedido " + order.id + ". Total: " + money(order.total) + ". Te enviaremos tu comprobante a este correo o por WhatsApp. Escríbenos: " + whatsapp("Hola VAIYO, mi pedido es " + order.id)
    });
  } catch (error) {
    console.error("Customer e-mail failed", orderId, error instanceof Error ? error.message : "unknown");
  }
}

// Safety net run by the cron trigger: sends the e-mail of any sale from the last 24 hours that has none yet
// (e.g. Resend was down). Card orders count as sales only once approved; TEST payments never do.
export async function resendMissingNotifications() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { results } = await database().prepare("SELECT id FROM orders WHERE notified_at IS NULL AND channel = 'web' AND status != 'cancelado' AND created_at >= ? AND (payment_mode IS NULL OR (payment_mode = 'PRODUCTION' AND payment_status IN ('autorizado','pagado'))) ORDER BY created_at LIMIT 20").bind(since).all<{ id: string }>();
    console.info("Sales e-mail retry: " + results.length + " pending");
    for (const { id } of results) await notifySales(id);
  } catch (error) {
    console.error("Sales e-mail retry failed", error instanceof Error ? error.stack ?? error.message : "unknown");
  }
}
