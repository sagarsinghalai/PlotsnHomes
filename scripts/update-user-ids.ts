import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const usersWithoutUserId = await prisma.user.findMany({
      where: { userId: null },
      select: { id: true, name: true, role: true, email: true },
    });

    console.log(`Found ${usersWithoutUserId.length} users without userId.`);

    let counter = 101;
    for (const u of usersWithoutUserId) {
      let candidateId = `USR-${counter}`;
      while (await prisma.user.findUnique({ where: { userId: candidateId } })) {
        counter++;
        candidateId = `USR-${counter}`;
      }
      await prisma.user.update({
        where: { id: u.id },
        data: { userId: candidateId },
      });
      console.log(`Updated user ${u.name} (${u.email}) -> userId: ${candidateId}`);
      counter++;
    }

    const totalUsers = await prisma.user.count();
    const usersWithId = await prisma.user.count({ where: { userId: { not: null } } });
    console.log(`Summary: ${usersWithId}/${totalUsers} users now have a valid userId.`);
  } catch (err) {
    console.error("Error updating userIds:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
