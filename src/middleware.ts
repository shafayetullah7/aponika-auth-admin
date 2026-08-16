import { createMiddleware } from "@solidjs/start/middleware";

function applySecurityHeaders(event: { response: { headers: Headers } }) {
  const { headers } = event.response;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  if (import.meta.env.PROD) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

export default createMiddleware({
  onBeforeResponse: (event) => {
    applySecurityHeaders(event);
  },
});
