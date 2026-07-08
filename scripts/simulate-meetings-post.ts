import { PrismaClient, MeetingStatus } from "@prisma/client";
const prisma = new PrismaClient();

async function simulateMeetingsPost(userId: string) {
  try {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const lead = await prisma.lead.findUnique({ where: { id: userId } });
      if (lead) {
        user = await prisma.user.findUnique({ where: { email: lead.email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: lead.email,
              name: lead.name,
              phone: lead.phone,
              passwordHash: "external-sso-placeholder",
              role: "BUYER",
            }
          });
          console.log(`Created user: ${user.id} (${user.email})`);
        } else {
          console.log(`Found existing user by email: ${user.id} (${user.email})`);
        }
      } else {
        console.log(`Lead not found for ID: ${userId}`);
      }
    } else {
      console.log(`Found existing user by ID: ${user.id} (${user.email})`);
    }

    if (!user) {
      return { error: "User not found" };
    }

    console.log("Success: User resolved:", user.id);
    return { ok: true, userId: user.id };
  } catch (err: any) {
    console.error("Simulation error:", err);
    return { error: err.message };
  }
}

async function main() {
  console.log("--- Simulating with Sourodeep (Lead ID: cmqjatx1y000bl7ys4ayceujg) ---");
  const res1 = await simulateMeetingsPost("cmqjatx1y000bl7ys4ayceujg");
  console.log(res1);

  console.log("--- Simulating with Sneha (Lead ID: cmqj6wanc00dql70kc7flzud9) ---");
  const res2 = await simulateMeetingsPost("cmqj6wanc00dql70kc7flzud9");
  console.log(res2);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
