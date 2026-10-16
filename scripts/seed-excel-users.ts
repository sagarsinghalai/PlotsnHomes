import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding users from User_Roles_Access_Guide.xlsx...");

  const usersToSeed = [
    {
      email: "admin@plotsnhomes.com",
      password: "demo1234",
      name: "Super Admin",
      role: Role.SUPERADMIN,
    },
    {
      email: "admin.staff@plotsnhomes.com",
      password: "Admin@12345",
      name: "Admin Staff",
      role: Role.EMPLOYEE,
    },
    {
      email: "employee@plotsnhomes.com",
      password: "Employee@12345",
      name: "Standard Employee",
      role: Role.EMPLOYEE,
    },
    {
      email: "agent1@plotsnhomes.com",
      password: "demo1234",
      name: "PlotsnHomes Agent 1",
      role: Role.AGENT,
    },
    {
      email: "seller@plotsnhomes.com",
      password: "Seller@12345",
      name: "PlotsnHomes Seller",
      role: Role.SELLER,
    },
    {
      email: "buyer@plotsnhomes.com",
      password: "demo1234",
      name: "PlotsnHomes Customer",
      role: Role.BUYER,
    },
  ];

  for (const u of usersToSeed) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          passwordHash,
          name: u.name,
          role: u.role,
        },
      });
      console.log(`Updated user: ${u.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          name: u.name,
          role: u.role,
        },
      });
      console.log(`Created user: ${u.email}`);
    }
  }

  console.log("Finished seeding Excel users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
