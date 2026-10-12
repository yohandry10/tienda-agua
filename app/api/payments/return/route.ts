import { paymentFields } from "@/lib/izipay-signature";
import { validatedAttempt, resultUrl } from "@/lib/payments";
import { paymentConfig } from "@/lib/izipay-config";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const fields = paymentFields(await request.text());
    const attempt = await validatedAttempt(fields);
    if (!attempt) return Response.redirect(paymentConfig().origin + "/pago?error=validacion", 303);
    // The browser return only displays status. The signed IPN updates the payment.
    return Response.redirect(paymentConfig().origin + resultUrl(attempt.token), 303);
  } catch { return new Response("No pudimos verificar el retorno del pago. Contacta a VAIYO.", { status: 400 }); }
}
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const path = /^[a-f0-9-]{36}$/.test(token) ? resultUrl(token) : "/pago";
  return Response.redirect(paymentConfig().origin + path, 303);
}
