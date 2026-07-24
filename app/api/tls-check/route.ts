import type { NextRequest } from "next/server";
import { isServableHost } from "@/lib/tenant";

// Caddy's on-demand-TLS `ask` endpoint. A certificate is issued only for the
// apex or a known, published tenant — so adding a tenant needs no TLS config,
// and an unknown or offline host can never trigger certificate issuance.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain") ?? "";
  if (domain && (await isServableHost(domain))) {
    return new Response("ok", { status: 200 });
  }
  return new Response("no", { status: 404 });
}
