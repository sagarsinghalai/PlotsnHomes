import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: "admin@plotsnhomes.com" },
  });
  if (!u) {
    console.log("ADMIN NOT FOUND - run: npx tsx prisma/seed.ts");
    return;
  }
  console.log({
    email: u.email,
    role: u.role,
    active: u.active,
    passwordOk: await bcrypt.compare("demo1234", u.passwordHash),
  });
  console.log("total users:", await prisma.user.count());
}

main()
  .finally(() => prisma.$disconnect());
