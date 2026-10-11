import { NextResponse } from "next/server";

/**
 * Security headers, including a Content-Security-Policy.
 *
 * Note on script-src: Next.js streams inline bootstrap scripts that are not
 * individually nonced, so a strict nonce + strict-dynamic policy blocks the app.
 * We allow 'self' (same-origin chunks) and 'unsafe-inline' for scripts, which
 * still blocks loading script from any other origin. React escapes all rendered
 * content, so there is no HTML-injection sink for inline script to begin with.
 * Everything else is locked down.
 */
export function middleware() {
  const isDev = process.env.NODE_ENV !== "production";

  const scriptSrc = isDev ? `'self' 'unsafe-inline' 'unsafe-eval'` : `'self' 'unsafe-inline'`;
  const connectSrc = isDev ? `'self' ws: wss:` : `'self'`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  if (!isDev) {
    response.headers.set(
      "strict-transport-security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icon.svg|favicon.ico|opengraph-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
