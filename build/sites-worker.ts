import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    // Sites injects identity in its private dispatcher. An independent public
    // Worker must never accept those identity headers from arbitrary visitors.
    if ((env as unknown as { VAIYO_EXTERNAL_HOSTING?: string }).VAIYO_EXTERNAL_HOSTING === "true") {
      const headers = new Headers(request.headers);
      for (const name of [...headers.keys()]) {
        if (name.startsWith("oai-authenticated-user-") || name.startsWith("oai-user-")) headers.delete(name);
      }
      request = new Request(request, { headers });
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return protect(request, env, () => runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx)));
  },
};

// Endpoints that create orders or payment sessions; Izipay notifications are not limited.
const LIMITED_PATHS = new Set(["/api/orders", "/api/payments/prepare", "/api/payments/retry"]);
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  // The checkout form posts only to this site and to the Izipay payment page.
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://secure.micuentaweb.pe",
};
type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

async function protect(request: Request, env: Cloudflare.Env, next: () => Promise<Response>) {
  const limiter = (env as unknown as { ORDER_LIMITER?: RateLimiter }).ORDER_LIMITER;
  if (limiter && request.method === "POST" && LIMITED_PATHS.has(new URL(request.url).pathname)) {
    const { success } = await limiter.limit({ key: request.headers.get("cf-connecting-ip") ?? "unknown" });
    if (!success) return withSecurityHeaders(Response.json({ error: "Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo." }, { status: 429, headers: { "Retry-After": "60" } }));
  }
  return withSecurityHeaders(await next());
}

function withSecurityHeaders(response: Response) {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!secured.headers.has(name)) secured.headers.set(name, value);
  }
  return secured;
}
