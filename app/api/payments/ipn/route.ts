import { paymentFields } from "@/lib/izipay-signature";
import { recordNotification } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ service: "VAIYO Izipay notifications" }, { headers: { "Cache-Control": "no-store" } }); }
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Unsupported payload", { status: 415 });
  let fields;
  try { fields = paymentFields(await request.text()); } catch { return new Response("Invalid payload", { status: 400 }); }
  try {
    if (!await recordNotification(fields)) return new Response("Invalid notification", { status: 400 });
    return new Response("OK", { headers: { "Cache-Control": "no-store" } });
  } catch { return new Response("Notification unavailable", { status: 503 }); }
}
