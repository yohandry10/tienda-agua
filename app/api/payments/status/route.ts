import { database } from "@/lib/orders";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(token)) return Response.json({ error: "Pago no encontrado." }, { status: 404 });
  try {
    const payment = await database().prepare("SELECT order_id AS id, amount AS total, mode, state FROM payment_attempts WHERE token = ?").bind(token).first();
    return Response.json(payment ?? { error: "Pago no encontrado." }, { status: payment ? 200 : 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return Response.json({ error: "No pudimos consultar el pago." }, { status: 503 }); }
}
