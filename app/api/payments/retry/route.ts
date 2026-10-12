import { database, sameOrigin } from "@/lib/orders";
import { preparePayment } from "@/lib/payments";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) { await request.arrayBuffer(); return Response.json({ error: "Origen no permitido." }, { status: 403 }); }
  try {
    const { token } = z.object({ token: z.string().uuid() }).strict().parse(await request.json());
    const attempt = await database().prepare("SELECT order_id FROM payment_attempts WHERE token = ?").bind(token).first<{ order_id: string }>();
    if (!attempt) return Response.json({ error: "Pago no encontrado." }, { status: 404 });
    return Response.json(await preparePayment(attempt.order_id), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No pudimos reabrir el pago. Contacta a VAIYO con tu número de pedido." }, { status: 503 }); }
}
