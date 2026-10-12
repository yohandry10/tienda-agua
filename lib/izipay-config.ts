import { env } from "cloudflare:workers";
export type PaymentMode = "TEST" | "PRODUCTION";
type Settings = { IZIPAY_MODE?: string; IZIPAY_SITE_ID?: string; IZIPAY_PUBLIC_URL?: string; IZIPAY_TEST_KEY?: string; IZIPAY_PRODUCTION_KEY?: string };
export function paymentConfig() {
  const settings = env as unknown as Settings;
  const mode = settings.IZIPAY_MODE;
  if ((mode !== "TEST" && mode !== "PRODUCTION") || !/^\d{8}$/.test(settings.IZIPAY_SITE_ID ?? "")) throw new Error("Payment unavailable");
  const key = mode === "TEST" ? settings.IZIPAY_TEST_KEY : settings.IZIPAY_PRODUCTION_KEY;
  if (!key) throw new Error("Payment unavailable");
  const origin = new URL(settings.IZIPAY_PUBLIC_URL ?? "https://aguavaiyo.com");
  if (origin.protocol !== "https:" && origin.hostname !== "127.0.0.1" && origin.hostname !== "localhost") throw new Error("Invalid payment origin");
  return { mode: mode as PaymentMode, siteId: settings.IZIPAY_SITE_ID!, key, origin: origin.origin };
}
