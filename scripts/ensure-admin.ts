import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "admin@plotsnhomes.com";
const ADMIN_PASSWORD = "demo1234";

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      name: "PlotsnHomes Admin",
      phone: "+1 555-0100",
      role: Role.SUPERADMIN,
      active: true,
    },
    update: {
      passwordHash: hash,
      role: Role.SUPERADMIN,
      active: true,
      phone: "+1 555-0100",
    },
  });
  console.log("Admin OK:", ADMIN_EMAIL, "/", ADMIN_PASSWORD);
}

main().finally(() => prisma.$disconnect());
