// Measures a public Shopify catalogue and prints JSON to stdout.
//
//   npm run audit:shopify -- example-store.com
//
// A development tool for authoring tenant records. It is never called at
// request time and holds no business-specific values. Wording of findings is
// left to a human: only mechanical measurements are emitted.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

interface Variant {
  available?: boolean;
  title?: string;
  price?: string;
}
interface Product {
  title?: string;
  vendor?: string;
  product_type?: string;
  body_html?: string;
  published_at?: string;
  variants?: Variant[];
  images?: unknown[];
}

async function fetchPage(domain: string, page: number): Promise<Product[]> {
  const res = await fetch(
    `https://${domain}/products.json?limit=50&page=${page}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) throw new Error(`${domain} page ${page}: HTTP ${res.status}`);
  const body = (await res.json()) as { products?: Product[] };
  return body.products ?? [];
}

async function main() {
  const domain = (process.argv[2] ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!domain) {
    console.error("Usage: npm run audit:shopify -- <store-domain>");
    process.exit(1);
  }

  const products: Product[] = [];
  for (let page = 1; page <= 40; page++) {
    const batch = await fetchPage(domain, page);
    if (!batch.length) break;
    products.push(...batch);
  }

  let variants = 0;
  let available = 0;
  let fullyUnavailable = 0;
  let partlyUnavailable = 0;
  let noDescription = 0;
  let uncategorised = 0;
  const sizeTotal = new Map<string, number>();
  const sizeGone = new Map<string, number>();
  const vendors = new Set<string>();

  for (const p of products) {
    const vs = p.variants ?? [];
    const av = vs.filter((v) => v.available);
    variants += vs.length;
    available += av.length;
    if (vs.length && !av.length) fullyUnavailable++;
    else if (vs.length && av.length < vs.length) partlyUnavailable++;

    for (const v of vs) {
      const t = (v.title ?? "").trim();
      if (!t || t.toLowerCase() === "default title") continue;
      sizeTotal.set(t, (sizeTotal.get(t) ?? 0) + 1);
      if (!v.available) sizeGone.set(t, (sizeGone.get(t) ?? 0) + 1);
    }

    if ((p.body_html ?? "").trim().length < 40) noDescription++;
    if (!(p.product_type ?? "").trim()) uncategorised++;
    if (p.vendor) vendors.add(p.vendor);
  }

  // Report the LARGEST size cohorts, not the worst-performing ones. Ranking by
  // percentage alone promotes small samples (a 93% miss out of 30) over the
  // runs that actually carry the catalogue, which would be both less useful and
  // closer to cherry-picking than measuring.
  const rows = [...sizeTotal.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, total]) => ({
      label,
      value: Math.round((100 * (sizeGone.get(label) ?? 0)) / total),
      caption: `${sizeGone.get(label) ?? 0} of ${total}`,
    }))
    .sort((a, b) => b.value - a.value);

  const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

  console.log(
    JSON.stringify(
      {
        measuredOn: new Date().toISOString().slice(0, 10),
        measurements: {
          products: products.length,
          variants,
          available,
          unavailable: variants - available,
          unavailablePct: pct(variants - available, variants),
          fullyUnavailable,
          partlyUnavailable,
          noDescription,
          noDescriptionPct: pct(noDescription, products.length),
          uncategorised,
          uncategorisedPct: pct(uncategorised, products.length),
          vendors: vendors.size,
        },
        suggested: {
          breakdown: { rows },
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
