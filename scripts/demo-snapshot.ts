import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.property.count({ where: { status: "ACTIVE" } });
  const users = await prisma.user.count();
  const featured = await prisma.property.findMany({
    where: { featured: true },
    take: 4,
    select: {
      symbol: true,
      title: true,
      price: true,
      city: true,
      state: true,
      yieldRate: true,
      change24h: true,
      changeYtd: true,
      marketRating: true,
    },
  });
  const topGainers = await prisma.property.findMany({
    orderBy: { changeYtd: "desc" },
    take: 6,
    select: { symbol: true, price: true, changeYtd: true, yieldRate: true },
  });
  const avg = await prisma.property.aggregate({
    _avg: { yieldRate: true, changeYtd: true, price: true },
  });

  console.log(JSON.stringify({ total, users, featured, topGainers, avg: avg._avg }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
