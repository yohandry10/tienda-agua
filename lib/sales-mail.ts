import { env } from "cloudflare:workers";
import { database } from "@/lib/orders";
import { money } from "@/lib/catalog";
import type { PaymentFields } from "@/lib/izipay-signature";

const SALES_EMAIL = "clientesc@aguavaiyo.com";
const FROM = "VAIYO Web <pedidos@aguavaiyo.com>";
type MailOrder = { id: string; name: string; phone: string; email: string | null; address: string; district: string; kind: string; ruc: string | null; payment: string; notes: string; items: string; total: number; created_at: string };

const pending: Record<string, string> = {
  "Yape o Plin": "PENDIENTE — el cliente enviará el voucher de Yape o Plin por WhatsApp.",
  "Transferencia": "PENDIENTE — el cliente enviará el comprobante de transferencia por WhatsApp.",
  "Efectivo al recibir": "PENDIENTE — pago en efectivo al recibir."
};
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const gatewayDate = (value = "") => /^\d{14}$/.test(value) ? value.slice(6, 8) + "/" + value.slice(4, 6) + "/" + value.slice(0, 4) + " " + value.slice(8, 10) + ":" + value.slice(10, 12) + " UTC" : value;

// Sends one e-mail per web order to sales: at registration for offline payments, at approval for card payments.
export async function notifySales(orderId: string, payment?: PaymentFields) {
  const apiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!apiKey) return;
  const db = database();
  const claim = await db.prepare("UPDATE orders SET notified_at = ? WHERE id = ? AND notified_at IS NULL").bind(new Date().toISOString(), orderId).run();
  if (!claim.meta.changes) return;
  try {
    const order = await db.prepare("SELECT id,name,phone,email,address,district,kind,ruc,payment,notes,items,total,created_at FROM orders WHERE id = ?").bind(orderId).first<MailOrder>();
    if (!order) return;
    const status = payment ? "PAGADO con tarjeta (Izipay)" : pending[order.payment] ?? "PENDIENTE";
    const rows: [string, string][] = [["Pedido", order.id], ["Fecha", new Date(order.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" })], ["Pago", order.payment], ["Estado del pago", status]];
    if (payment) rows.push(
      ["Voucher Izipay · Transacción", payment.vads_trans_uuid ?? ""], ["N.° de autorización", payment.vads_auth_number ?? ""],
      ["Tarjeta", [payment.vads_card_brand, payment.vads_card_number].filter(Boolean).join(" ")], ["Fecha del pago", gatewayDate(payment.vads_effective_creation_date ?? payment.vads_trans_date)],
      ["Importe pagado", money(Number(payment.vads_amount))]
    );
    rows.push(["Pedido para", order.kind]);
    if (order.ruc) rows.push(["RUC", order.ruc]);
    rows.push(["Cliente", order.name], ["WhatsApp", order.phone]);
    if (order.email) rows.push(["Correo", order.email]);
    rows.push(["Distrito", order.district], ["Dirección", order.address], ["Referencia", order.notes || "—"]);
    for (const item of JSON.parse(order.items) as { name: string; qty: number; price: number }[]) rows.push([item.qty + " x " + item.name, money(item.price * item.qty)]);
    rows.push(["Total", money(order.total)]);
    const html = "<h2 style=\"font-family:Arial,sans-serif;color:#062c64\">Nuevo pedido web " + escape(order.id) + "</h2><table style=\"font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse\">"
      + rows.map(([label, value]) => "<tr><td style=\"padding:6px 14px 6px 0;color:#4b5f7c;vertical-align:top\">" + escape(label) + "</td><td style=\"padding:6px 0;color:#062c64;font-weight:600\">" + escape(value) + "</td></tr>").join("") + "</table>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "vaiyo-order-" + order.id },
      body: JSON.stringify({
        from: FROM, to: [SALES_EMAIL], ...(order.email ? { reply_to: order.email } : {}),
        subject: "Pedido web " + order.id + " · " + (payment ? "PAGADO" : "Pago pendiente") + " · " + money(order.total) + " · " + order.kind,
        html, text: rows.map(([label, value]) => label + ": " + value).join("\n")
      })
    });
    if (!response.ok) throw new Error("Resend " + response.status + ": " + (await response.text()).slice(0, 200));
  } catch (error) {
    // Release the claim so a later event can retry the e-mail.
    await db.prepare("UPDATE orders SET notified_at = NULL WHERE id = ?").bind(orderId).run();
    console.error("Sales e-mail failed", orderId, error instanceof Error ? error.message : "unknown");
  }
}
