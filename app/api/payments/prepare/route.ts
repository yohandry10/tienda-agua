import { registerOrder } from "@/lib/register-order";
import { orderSchema, sameOrigin } from "@/lib/orders";
import { preparePayment } from "@/lib/payments";
import { paymentConfig } from "@/lib/izipay-config";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) { await request.arrayBuffer(); return Response.json({ error: "Origen no permitido." }, { status: 403 }); }
  try {
    paymentConfig();
    const input = orderSchema.parse(await request.json());
    if (input.customer.payment !== "Pago online (Izipay)" || input.channel === "vendedor") return Response.json({ error: "Elige pago online y completa tu correo." }, { status: 400 });
    const response = await registerOrder(input);
    if (!response.ok) return response;
    const order = await response.json() as { id: string };
    return Response.json(await preparePayment(order.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const invalid = error instanceof Error && (error.name === "ZodError" || error.message.startsWith("Revisa"));
    return Response.json({ error: invalid ? "Revisa tus datos y tu correo electrónico." : "No pudimos abrir el pago. Tus datos siguen aquí; vuelve a intentarlo." }, { status: invalid ? 400 : 503 });
  }
}
