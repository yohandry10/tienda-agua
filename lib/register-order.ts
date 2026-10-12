import { database, orderSchema, calculateItems, identity, teamRole } from "@/lib/orders";
import { paymentConfig } from "@/lib/izipay-config";
import type { z } from "zod";

export async function registerOrder(data: z.infer<typeof orderSchema>) {
  const paymentMode = data.customer.payment === "Pago online (Izipay)" ? paymentConfig().mode : null;
  const user = await identity();
  const channel = data.channel ?? "web";
  if (channel === "vendedor" && !await teamRole(user)) return Response.json({ error: "Se requiere acceso del equipo." }, { status: 403 });
  const items = calculateItems(data.items);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({ items, customer: data.customer, user: user?.userId ?? null, channel }))))).map(value => value.toString(16).padStart(2, "0")).join("");
  const db = database();
  const previous = await db.prepare("SELECT id,total,fingerprint FROM orders WHERE request_id = ?").bind(data.requestId).first<{ id: string; total: number; fingerprint: string }>();
  if (previous) {
    if (previous.fingerprint !== fingerprint) return Response.json({ error: "Este intento ya corresponde a otro pedido. Abre un pedido nuevo." }, { status: 409 });
    return Response.json({ id: previous.id, total: previous.total });
  }
  const id = "VA-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const now = new Date().toISOString();
  const customer = data.customer;
  await db.prepare("INSERT INTO orders (id,request_id,fingerprint,user_id,creator_id,name,phone,address,district,kind,payment,notes,items,total,status,channel,created_at,updated_at,email,payment_mode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING")
    .bind(id, data.requestId, fingerprint, channel === "web" ? user?.userId ?? null : null, user?.userId ?? null, customer.name, customer.phone, customer.address, customer.district, customer.kind, customer.payment, customer.notes, JSON.stringify(items), total, "pendiente", channel, now, now, customer.email ?? null, paymentMode).run();
  const saved = await db.prepare("SELECT id,total,fingerprint FROM orders WHERE request_id = ?").bind(data.requestId).first<{ id: string; total: number; fingerprint: string }>();
  if (!saved || saved.fingerprint !== fingerprint) return Response.json({ error: "No se pudo registrar este intento." }, { status: 409 });
  return Response.json({ id: saved.id, total: saved.total }, { status: 201 });
}
