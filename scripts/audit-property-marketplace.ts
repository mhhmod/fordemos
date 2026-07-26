// Measures a public Next.js property marketplace and prints JSON to stdout.
//
//   npx tsx scripts/audit-property-marketplace.ts example.com
//
// The script discovers the site's listing API from its own JavaScript, then
// cross-checks search results, sitemap URLs and listing-page __NEXT_DATA__.
// It contains no tenant-specific values and is never called at request time.

export {};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const PAGE_SAMPLE = 200;
const COMPLETENESS_SAMPLE = 100;
const SEARCH_PAGE_SIZE = 50;
const SEARCH_PAGES = 10;
const CONCURRENCY = 6;

interface SearchProperty {
  id: number;
  slug?: string;
  imageUrl?: string;
  unitArea?: number;
  readyBy?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  paymentPlan?: { minPrice?: number };
  compound?: { slug?: string };
}

interface SearchResponse {
  page?: number;
  pageSize?: number;
  total?: number;
  results?: SearchProperty[];
}

interface PageProperty {
  id?: number;
  onSale?: boolean;
  price?: number;
  minPrice?: number;
  minUnitArea?: number;
  maxUnitArea?: number;
  deliveryDate?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  images?: string[];
  metaDescription?: string;
  name?: string;
}

interface PageResult {
  url: string;
  status: number;
  property?: PageProperty;
}

function domainArg(): string {
  return (process.argv[2] ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

async function fetchWithRetry(url: string, attempts = 5): Promise<Response> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
    });
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt === attempts) return res;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }
  throw new Error(`Unable to fetch ${url}`);
}

function urlsInXml(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function nextData(html: string): Record<string, unknown> | undefined {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) return undefined;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function pageProperty(html: string): PageProperty | undefined {
  const root = nextData(html);
  const props = root?.props as Record<string, unknown> | undefined;
  const pageProps = props?.pageProps as Record<string, unknown> | undefined;
  const property = pageProps?.property;
  return property && typeof property === "object"
    ? (property as PageProperty)
    : undefined;
}

function spreadSample<T>(items: T[], size: number): T[] {
  if (items.length <= size) return items;
  return Array.from({ length: size }, (_, index) => {
    const at = Math.floor((index * (items.length - 1)) / (size - 1));
    return items[at];
  });
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  let cursor = 0;
  const results = new Array<R>(items.length);
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

async function discoverListingApi(origin: string, html: string): Promise<string> {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(
    (match) => new URL(match[1], origin).href,
  );
  for (const script of scripts) {
    const res = await fetchWithRetry(script);
    if (!res.ok) continue;
    const source = await res.text();
    const explicit = source.match(
      /PUBLIC_NEW_API\s*=\s*"(https:\/\/[^"]+)"/,
    )?.[1];
    const fallback = source.match(
      /https:\/\/[a-z0-9.-]*listing-api[a-z0-9.-]*/i,
    )?.[0];
    if (explicit || fallback) return (explicit ?? fallback)!.replace(/\/$/, "");
  }
  throw new Error("Could not discover a public listing API from site scripts");
}

async function loadPage(url: string): Promise<PageResult> {
  const res = await fetchWithRetry(url);
  const html = await res.text();
  return { url, status: res.status, property: pageProperty(html) };
}

function propertyId(url: string): number | undefined {
  const match = new URL(url).pathname.match(/\/property\/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

async function main() {
  const domain = domainArg();
  if (!domain) {
    console.error(
      "Usage: npx tsx scripts/audit-property-marketplace.ts <domain>",
    );
    process.exit(1);
  }

  const origin = `https://${domain}`;
  const homeRes = await fetchWithRetry(`${origin}/`);
  if (!homeRes.ok) throw new Error(`${domain} homepage: HTTP ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  const api = await discoverListingApi(origin, homeHtml);

  const sitemapIndexRes = await fetchWithRetry(`${origin}/sitemap.xml`);
  if (!sitemapIndexRes.ok) {
    throw new Error(`${domain} sitemap: HTTP ${sitemapIndexRes.status}`);
  }
  const sitemapIndex = await sitemapIndexRes.text();
  const propertySitemaps = urlsInXml(sitemapIndex).filter((url) =>
    /propert(?:y|ies)[^/]*\.xml(?:$|\?)/i.test(url),
  );
  if (!propertySitemaps.length) {
    throw new Error("No property sitemaps found in sitemap index");
  }

  const sitemapBodies = await mapConcurrent(
    propertySitemaps,
    4,
    async (url) => {
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return res.text();
    },
  );
  const sitemapUrls = sitemapBodies.flatMap(urlsInXml);

  // Collapse translated and legacy aliases to one representative URL per
  // property. The shortest path is deterministic and usually the primary URL.
  const urlById = new Map<number, string>();
  for (const url of sitemapUrls) {
    const id = propertyId(url);
    if (!id) continue;
    const existing = urlById.get(id);
    if (!existing || new URL(url).pathname.length < new URL(existing).pathname.length) {
      urlById.set(id, url);
    }
  }

  const sitemapSample = spreadSample([...urlById.entries()], PAGE_SAMPLE);
  const sampledPages = await mapConcurrent(
    sitemapSample,
    CONCURRENCY,
    async ([, url]) => loadPage(url),
  );

  const parsedSitemapPages = sampledPages.filter((page) => page.property);
  const offMarket = parsedSitemapPages.filter(
    (page) => page.property?.onSale === false,
  );

  // The search endpoint accepts at most 20 repeated propertyIds parameters.
  const searchVisible = new Set<number>();
  for (let index = 0; index < sitemapSample.length; index += 20) {
    const query = sitemapSample
      .slice(index, index + 20)
      .map(([id]) => `propertyIds=${id}`)
      .join("&");
    const res = await fetchWithRetry(
      `${api}/v1/search/properties?pageSize=50&${query}`,
    );
    if (!res.ok) throw new Error(`Search membership: HTTP ${res.status}`);
    const body = (await res.json()) as SearchResponse;
    for (const property of body.results ?? []) searchVisible.add(property.id);
  }
  const offMarketConfirmed = offMarket.filter(
    (page) =>
      page.property?.id !== undefined && !searchVisible.has(page.property.id),
  );

  const slugChecks = parsedSitemapPages.flatMap((page) => {
    const slugBedrooms = decodeURIComponent(page.url).match(
      /with-(\d+)-bedrooms/i,
    )?.[1];
    const pageBedrooms = page.property?.numberOfBedrooms;
    if (slugBedrooms === undefined || pageBedrooms === undefined) return [];
    const slugValue = Number(slugBedrooms);
    return [
      {
        id: page.property?.id,
        url: page.url,
        slugBedrooms: slugValue,
        pageBedrooms,
        agrees: slugValue === pageBedrooms,
        metaConfirmsPage:
          typeof page.property?.metaDescription === "string" &&
          new RegExp(`\\b${pageBedrooms} bedrooms?\\b`, "i").test(
            page.property.metaDescription,
          ),
      },
    ];
  });
  const slugMismatches = slugChecks.filter((check) => !check.agrees);

  // Sample ten evenly-spaced API pages, then cross-check 100 records against
  // their rendered detail pages. These are independent public representations
  // of the same listing data.
  const firstSearchRes = await fetchWithRetry(
    `${api}/v1/search/properties?page=1&pageSize=${SEARCH_PAGE_SIZE}`,
  );
  if (!firstSearchRes.ok) {
    throw new Error(`Property search: HTTP ${firstSearchRes.status}`);
  }
  const firstSearch = (await firstSearchRes.json()) as SearchResponse;
  const total = firstSearch.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const searchPageNumbers = spreadSample(
    Array.from({ length: totalPages }, (_, index) => index + 1),
    SEARCH_PAGES,
  );
  const searchBatches = await mapConcurrent(
    searchPageNumbers,
    3,
    async (page) => {
      if (page === 1) return firstSearch.results ?? [];
      const res = await fetchWithRetry(
        `${api}/v1/search/properties?page=${page}&pageSize=${SEARCH_PAGE_SIZE}`,
      );
      if (!res.ok) throw new Error(`Property search page ${page}: HTTP ${res.status}`);
      return ((await res.json()) as SearchResponse).results ?? [];
    },
  );
  const searchSample = spreadSample(searchBatches.flat(), COMPLETENESS_SAMPLE);
  const completenessPages = await mapConcurrent(
    searchSample,
    CONCURRENCY,
    async (property) => {
      const sitemapUrl = urlById.get(property.id);
      const fallback =
        property.compound?.slug && property.slug
          ? `${origin}/compound/${property.compound.slug}/property/${property.slug}`
          : undefined;
      return {
        search: property,
        page: sitemapUrl || fallback ? await loadPage(sitemapUrl ?? fallback!) : undefined,
      };
    },
  );

  const completenessFields = {
    price: [
      (item: SearchProperty) => !!item.paymentPlan?.minPrice,
      (item: PageProperty) => !!(item.price ?? item.minPrice),
    ],
    area: [
      (item: SearchProperty) => !!item.unitArea,
      (item: PageProperty) => !!(item.minUnitArea ?? item.maxUnitArea),
    ],
    delivery: [
      (item: SearchProperty) => !!item.readyBy,
      (item: PageProperty) => !!item.deliveryDate,
    ],
    bedrooms: [
      (item: SearchProperty) => item.numberOfBedrooms !== undefined,
      (item: PageProperty) => item.numberOfBedrooms !== undefined,
    ],
    bathrooms: [
      (item: SearchProperty) => item.numberOfBathrooms !== undefined,
      (item: PageProperty) => item.numberOfBathrooms !== undefined,
    ],
  } as const;

  const completeness = Object.fromEntries(
    Object.entries(completenessFields).map(([name, [inSearch, onPage]]) => [
      name,
      {
        searchPresent: completenessPages.filter(({ search }) => inSearch(search))
          .length,
        pagePresent: completenessPages.filter(({ page }) =>
          page?.property ? onPage(page.property) : false,
        ).length,
        presentInBoth: completenessPages.filter(
          ({ search, page }) =>
            inSearch(search) && !!page?.property && onPage(page.property),
        ).length,
      },
    ]),
  );

  const ogImage = homeHtml.match(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
  )?.[1];
  const ogSiteName = /<meta[^>]+property="og:site_name"/i.test(homeHtml);
  let ogImageCheck:
    | { status: number; contentType: string | null; bytes: number }
    | undefined;
  if (ogImage) {
    const res = await fetchWithRetry(ogImage);
    ogImageCheck = {
      status: res.status,
      contentType: res.headers.get("content-type"),
      bytes: (await res.arrayBuffer()).byteLength,
    };
  }

  console.log(
    JSON.stringify(
      {
        measuredOn: new Date().toISOString().slice(0, 10),
        sources: {
          homepage: `${origin}/`,
          listingApi: api,
          sitemapIndex: `${origin}/sitemap.xml`,
          propertySitemaps: propertySitemaps.length,
        },
        marketplace: {
          searchReportedProperties: total,
          sitemapEntries: sitemapUrls.length,
          uniqueSitemapPropertyIds: urlById.size,
        },
        listingCompleteness: {
          sample: completenessPages.length,
          pageHttp200: completenessPages.filter(
            ({ page }) => page?.status === 200,
          ).length,
          pageDataParsed: completenessPages.filter(({ page }) => page?.property)
            .length,
          fields: completeness,
        },
        sitemapSample: {
          sample: sampledPages.length,
          pageHttp200: sampledPages.filter((page) => page.status === 200).length,
          pageDataParsed: parsedSitemapPages.length,
          offMarketPages: offMarket.length,
          offMarketAbsentFromSearch: offMarketConfirmed.length,
          offMarketExamples: offMarketConfirmed.slice(0, 10).map((page) => ({
            id: page.property?.id,
            title: page.property?.name,
            url: page.url,
          })),
          urlsWithBedroomCount: slugChecks.length,
          bedroomCountMismatches: slugMismatches.length,
          mismatchesConfirmedByMetaDescription: slugMismatches.filter(
            (check) => check.metaConfirmsPage,
          ).length,
          mismatchExamples: slugMismatches.slice(0, 10),
        },
        sharing: {
          ogImage,
          ogImageCheck,
          ogSiteNamePresent: ogSiteName,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
