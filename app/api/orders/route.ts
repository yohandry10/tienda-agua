import { orderSchema, sameOrigin } from "@/lib/orders";
import { registerOrder } from "@/lib/register-order";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) { await request.arrayBuffer(); return Response.json({ error: "Origen no permitido." }, { status: 403 }); }
  try { return await registerOrder(orderSchema.parse(await request.json())); }
  catch (error) {
    if (error instanceof Error && (error.name === "ZodError" || error.message.startsWith("Revisa"))) return Response.json({ error: "Revisa tus datos, la cobertura de entrega y el mínimo de 3 packs." }, { status: 400 });
    console.error("Order save failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "No pudimos registrar tu pedido. Tus datos siguen aquí; vuelve a intentarlo." }, { status: 503 });
  }
}
