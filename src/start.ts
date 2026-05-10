import { createStart, createMiddleware } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

// Global response security headers. Applied to every request (SSR pages,
// server functions, server routes). Tuned for this app:
//   - QR scanner needs camera (Permissions-Policy)
//   - Supabase HTTPS + WSS connections allowed
//   - Google Maps iframe allowed (frame-src)
//   - Lovable editor preview iframes allowed (frame-ancestors)
const securityHeaders = createMiddleware().server(async ({ next }) => {
  setResponseHeaders({
    "Content-Security-Policy": [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app https://*.lovable.dev",
      "frame-src 'self' https://www.google.com https://maps.google.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev",
    ].join("; "),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), geolocation=(), microphone=(), payment=()",
  });
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}));