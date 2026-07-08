import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@plotsnhomes.com" },
  });
  if (!admin) {
    console.log("NO_ADMIN: Run npx tsx prisma/seed.ts");
    return;
  }
  const ok = await bcrypt.compare("demo1234", admin.passwordHash);
  console.log("Admin exists:", admin.email, "role:", admin.role);
  console.log("Password demo1234 matches:", ok);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
