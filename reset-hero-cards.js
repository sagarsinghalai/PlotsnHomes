const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'site_hero_cards' },
    update: { value: '[]' },
    create: { key: 'site_hero_cards', value: '[]' }
  });
  console.log("Cleared site_hero_cards");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
