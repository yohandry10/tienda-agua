import { META_PIXEL_ID } from "@/lib/meta-config";

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: PixelFunction;
};
declare global { interface Window { fbq?: PixelFunction; _fbq?: PixelFunction; vaiyoMetaInitialized?: string } }

export const META_CONSENT_KEY = "vaiyo-meta-consent";
export const META_CONSENT_EVENT = "vaiyo-meta-consent-change";
export const metaEnabled = /^\d{5,32}$/.test(META_PIXEL_ID);

function consented() {
  try { return localStorage.getItem(META_CONSENT_KEY) === "yes"; } catch { return false; }
}

export function startMetaPixel() {
  if (!metaEnabled || !consented() || typeof window === "undefined") return false;
  if (!["/", "/pago"].includes(window.location.pathname)) return false;
  // The payment URL contains an access token. Never load Meta if it is still visible.
  if (window.location.pathname === "/pago" && window.location.search) return false;
  if (!window.fbq) {
    const pixel: PixelFunction = (...args) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue?.push(args);
    };
    pixel.queue = []; pixel.push = pixel; pixel.loaded = true; pixel.version = "2.0";
    window.fbq = window._fbq = pixel;
    const script = document.createElement("script");
    script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (window.vaiyoMetaInitialized !== META_PIXEL_ID) {
    window.fbq!("set", "autoConfig", false, META_PIXEL_ID);
    window.fbq!("init", META_PIXEL_ID);
    window.fbq!("trackSingle", META_PIXEL_ID, "PageView");
    window.vaiyoMetaInitialized = META_PIXEL_ID;
  }
  return true;
}

export function trackMeta(event: "AddToCart" | "InitiateCheckout" | "Lead" | "Purchase", params: Record<string, unknown>) {
  try {
    if (!startMetaPixel()) return false;
    window.fbq?.("trackSingle", META_PIXEL_ID, event, params);
    return true;
  } catch { return false; }
}

export function trackConfirmedPurchase(payment: { id: string; total: number; mode: string; state: string }) {
  if (payment.mode !== "PRODUCTION" || !["pagado", "autorizado"].includes(payment.state) || !consented() || !metaEnabled) return;
  const key = `vaiyo-meta-purchase:${payment.id}`;
  try {
    if (localStorage.getItem(key)) return;
    if (trackMeta("Purchase", { value: payment.total / 100, currency: "PEN" })) localStorage.setItem(key, "1");
  } catch { /* Analytics must never affect payment results. */ }
}
