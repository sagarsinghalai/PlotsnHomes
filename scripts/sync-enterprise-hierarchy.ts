import { prisma } from "../src/lib/prisma";
import { DEFAULT_PERMISSIONS } from "../src/lib/permissions";
import { roleHierarchyLevel, roleDataScope } from "../src/lib/roles";
import { DEFAULT_FIELD_PRIVACY_MATRIX } from "../src/lib/field-privacy";

async function main() {
  console.log("==================================================");
  console.log(" Enterprise Hierarchy, Units & Privacy Sync ");
  console.log("==================================================");

  // 1. Sync System Setting: user_role_permissions & user_field_privacy_settings
  console.log("\n1. Updating System Settings for Permissions & Field Privacy...");
  await prisma.systemSetting.upsert({
    where: { key: "user_role_permissions" },
    update: { value: JSON.stringify(DEFAULT_PERMISSIONS, null, 2) },
    create: { key: "user_role_permissions", value: JSON.stringify(DEFAULT_PERMISSIONS, null, 2) },
  });

  await prisma.systemSetting.upsert({
    where: { key: "user_field_privacy_settings" },
    update: { value: JSON.stringify(DEFAULT_FIELD_PRIVACY_MATRIX, null, 2) },
    create: { key: "user_field_privacy_settings", value: JSON.stringify(DEFAULT_FIELD_PRIVACY_MATRIX, null, 2) },
  });
  console.log("✓ System Settings updated.");

  // 2. Create Default Enterprise Units if none exist
  console.log("\n2. Seeding Default Enterprise Units...");
  
  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" } });

  const org = await prisma.organization.upsert({
    where: { code: "ORG-PLOTSNHOMES" },
    update: {},
    create: {
      name: "PlotsnHomes Enterprise",
      code: "ORG-PLOTSNHOMES",
      domain: "plotsnhomes.com",
      whiteLabelAdminId: superAdmin?.id || null,
      status: "ACTIVE",
    },
  });

  const franchise = await prisma.franchise.upsert({
    where: { code: "FR-NORTH-01" },
    update: {},
    create: {
      tenantId: org.id,
      name: "North Region Franchise",
      code: "FR-NORTH-01",
      organizationId: org.id,
      location: "North Region",
      status: "ACTIVE",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: "BR-DEL-CENTRAL" },
    update: {},
    create: {
      tenantId: org.id,
      name: "Delhi Central Branch",
      code: "BR-DEL-CENTRAL",
      franchiseId: franchise.id,
      city: "New Delhi",
      status: "ACTIVE",
    },
  });

  const dept = await prisma.department.upsert({
    where: { code: "DEPT-SALES-CRM" },
    update: {},
    create: {
      tenantId: org.id,
      name: "Sales & CRM Department",
      code: "DEPT-SALES-CRM",
      branchId: branch.id,
      status: "ACTIVE",
    },
  });

  const team = await prisma.team.upsert({
    where: { code: "TEAM-ALPHA" },
    update: {},
    create: {
      tenantId: org.id,
      name: "Alpha Sales Team",
      code: "TEAM-ALPHA",
      departmentId: dept.id,
      status: "ACTIVE",
    },
  });

  console.log(`✓ Default Enterprise Units Seeded:`);
  console.log(`  - Organization: ${org.name} (${org.code})`);
  console.log(`  - Franchise: ${franchise.name} (${franchise.code})`);
  console.log(`  - Branch: ${branch.name} (${branch.code})`);
  console.log(`  - Department: ${dept.name} (${dept.code})`);
  console.log(`  - Team: ${team.name} (${team.code})`);

  // 3. Migrate User records
  console.log("\n3. Migrating User records in database...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to migrate.`);

  let updatedCount = 0;
  for (const user of users) {
    const level = roleHierarchyLevel(user.role);
    const scope = roleDataScope(user.role);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hierarchyLevel: level,
        dataScope: scope,
        tenantId: user.tenantId || org.id,
        franchiseId: user.franchiseId || franchise.id,
        branchId: user.branchId || branch.id,
        departmentId: user.departmentId || dept.id,
        teamId: user.teamId || team.id,
      },
    });
    updatedCount++;
  }

  console.log(`✓ Migrated ${updatedCount} users successfully.`);
  console.log("==================================================");
  console.log(" Enterprise Sync Completed Successfully! ");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Error during sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
