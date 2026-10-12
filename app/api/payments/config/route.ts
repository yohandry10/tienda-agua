import { paymentConfig } from "@/lib/izipay-config";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const { mode } = paymentConfig(); return Response.json({ available: true, mode }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ available: false }, { headers: { "Cache-Control": "no-store" } }); }
}
