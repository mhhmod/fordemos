import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// Onboard or update a tenant from a JSON record. This is the entire "add a
// business" workflow: author a data file, run this once. No code, no build,
// no deploy, no branch.
//
//   DATABASE_URL=file:/data/app.db npm run tenant:upsert -- ./acme.json

const prisma = new PrismaClient();

const SUBDOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run tenant:upsert -- <path-to-record.json>");
    process.exit(1);
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`Could not read/parse ${file}: ${(e as Error).message}`);
    process.exit(1);
  }

  const subdomain = String(config.id ?? "").trim().toLowerCase();
  if (!SUBDOMAIN.test(subdomain)) {
    console.error(
      `Record needs a valid "id" (subdomain label: lowercase letters, digits, hyphens). Got: ${JSON.stringify(config.id)}`,
    );
    process.exit(1);
  }

  const status = config.status === "offline" ? "offline" : "published";
  const hostnames = Array.isArray(config.hostnames)
    ? JSON.stringify(config.hostnames.filter((h) => typeof h === "string"))
    : "[]";
  const configStr = JSON.stringify(config);

  await prisma.tenant.upsert({
    where: { subdomain },
    create: { subdomain, status, hostnames, config: configStr },
    update: { status, hostnames, config: configStr },
  });

  const base = process.env.BASE_DOMAIN ?? "grindctrl.cloud";
  console.log(`✓ ${subdomain} (${status})  →  https://${subdomain}.${base}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
