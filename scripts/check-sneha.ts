import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: "Sneha" } }
  });
  console.log("--- Matching Users ---");
  console.log(JSON.stringify(users, null, 2));

  const leads = await prisma.lead.findMany({
    where: { name: { contains: "Sneha" } }
  });
  console.log("--- Matching Leads ---");
  console.log(JSON.stringify(leads, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
