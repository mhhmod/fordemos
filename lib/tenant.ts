import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "./db";
import { normalizeTenant, type NormalizedTenant } from "./normalize";

// Types and the pure normaliser live in ./normalize; re-exported so existing
// imports (components, app/page.tsx) keep working unchanged.
export * from "./normalize";

export interface LoadedTenant {
  status: string;
  data: NormalizedTenant;
}

// ---- request-time resolution ------------------------------------------------

const resolveRow = cache(
  async (subdomain: string | null, host: string | null) => {
    if (subdomain) {
      const row = await prisma.tenant.findUnique({ where: { subdomain } });
      if (row) return row;
    }
    if (host) {
      // Rare path: a tenant reachable by an explicit custom hostname.
      const rows = await prisma.tenant.findMany({
        where: { NOT: { hostnames: "[]" } },
      });
      for (const r of rows) {
        try {
          const hs = JSON.parse(r.hostnames);
          if (Array.isArray(hs) && hs.includes(host)) return r;
        } catch {
          /* ignore malformed hostnames */
        }
      }
    }
    return null;
  },
);

/** Resolve the tenant for the current request (deduped per request). */
export const getTenant = cache(async (): Promise<LoadedTenant | null> => {
  const h = await headers();
  const subdomain = h.get("x-tenant") || null;
  const host = h.get("x-host") || null;
  const row = await resolveRow(subdomain, host);
  if (!row) return null;
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(row.config);
  } catch {
    /* malformed config still renders as an empty-but-composed page */
  }
  return { status: row.status, data: normalizeTenant(row.subdomain, parsed) };
});

/** Base domain the platform serves subdomains under. */
export function baseDomain(): string {
  return (process.env.BASE_DOMAIN ?? "grindctrl.cloud").toLowerCase();
}

/**
 * Whether a hostname should be served a certificate / page. Used by the Caddy
 * on-demand-TLS `ask` endpoint so certificates are only ever minted for the
 * apex or a known, published tenant.
 */
export async function isServableHost(hostRaw: string): Promise<boolean> {
  const host = hostRaw.trim().toLowerCase().split(":")[0];
  if (!host) return false;
  const base = baseDomain();
  if (host === base) return true; // apex: neutral platform page
  let subdomain: string | null = null;
  if (host.endsWith("." + base)) {
    subdomain = host.slice(0, -(base.length + 1)).split(".")[0];
    if (subdomain === "www") subdomain = null;
  }
  const row = await resolveRow(subdomain, host);
  return !!row && row.status === "published";
}
