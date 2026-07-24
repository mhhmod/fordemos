import { PrismaClient } from "@prisma/client";

// The kill switch. Flip a single tenant online/offline instantly — the change
// is read on the next request, with no restart and no redeploy.
//
//   npm run tenant:offline -- acme      # take one tenant down
//   npm run tenant:online  -- acme      # bring it back

const prisma = new PrismaClient();

async function main() {
  const status = process.argv[2];
  const id = (process.argv[3] ?? "").trim().toLowerCase();

  if ((status !== "offline" && status !== "published") || !id) {
    console.error("Usage: npm run tenant:offline -- <id>   (or tenant:online)");
    process.exit(1);
  }

  const res = await prisma.tenant.updateMany({
    where: { subdomain: id },
    data: { status },
  });

  if (res.count === 0) {
    console.error(`No tenant found with id "${id}".`);
    process.exit(1);
  }

  console.log(`✓ ${id} is now ${status}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
