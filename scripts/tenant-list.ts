import { PrismaClient } from "@prisma/client";

// Quick inventory of what's live.  npm run tenant:list
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.tenant.findMany({ orderBy: { subdomain: "asc" } });
  if (rows.length === 0) {
    console.log("(no tenants yet)");
    return;
  }
  for (const r of rows) {
    let name = "";
    try {
      name = (JSON.parse(r.config)?.brand?.name as string) ?? "";
    } catch {
      /* ignore */
    }
    console.log(`${r.status.padEnd(10)} ${r.subdomain.padEnd(18)} ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
