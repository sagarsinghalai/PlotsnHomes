import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  console.log("--- System Settings ---");
  console.log(JSON.stringify(settings, null, 2));

  const meetings = await prisma.meetingInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { name: true, email: true, phone: true } },
    }
  });
  console.log("--- Recent Meetings ---");
  console.log(JSON.stringify(meetings, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
