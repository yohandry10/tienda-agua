import { database } from "@/lib/orders";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(token)) return Response.json({ error: "Pago no encontrado." }, { status: 404 });
  try {
    const payment = await database().prepare("SELECT p.order_id AS id, p.amount AS total, p.mode, p.state, o.items FROM payment_attempts p JOIN orders o ON o.id = p.order_id WHERE p.token = ?").bind(token).first<{ id: string; total: number; mode: string; state: string; items: string }>();
    const receipt = payment ? { ...payment, items: (JSON.parse(payment.items) as { name: string; qty: number; price: number }[]).map(({ name, qty, price }) => ({ name, qty, price })) } : null;
    return Response.json(receipt ?? { error: "Pago no encontrado." }, { status: payment ? 200 : 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return Response.json({ error: "No pudimos consultar el pago." }, { status: 503 }); }
}
