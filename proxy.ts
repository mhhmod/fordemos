import { NextRequest, NextResponse } from "next/server";

// Resolve the tenant from the requested hostname and hand it to the app via
// request headers. Every response also carries a hard noindex directive.
// (Next 16's "proxy" convention — formerly "middleware".)
const BASE_DOMAIN = (process.env.BASE_DOMAIN ?? "grindctrl.cloud").toLowerCase();

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  let subdomain = "";
  if (host.endsWith("." + BASE_DOMAIN)) {
    const label = host.slice(0, -(BASE_DOMAIN.length + 1)).split(".")[0];
    if (label && label !== "www") subdomain = label;
  } else if (host.endsWith(".localhost") || host.endsWith(".lvh.me")) {
    // developer convenience: <sub>.localhost resolves to tenant <sub>
    subdomain = host.split(".")[0];
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant", subdomain);
  requestHeaders.set("x-host", host);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|api/).*)"],
};
