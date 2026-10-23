import { prisma } from "../src/lib/prisma";
import { DEFAULT_PERMISSIONS } from "../src/lib/permissions";
import { DEFAULT_FIELD_PRIVACY_MATRIX } from "../src/lib/field-privacy";

async function main() {
  console.log("==================================================");
  console.log(" Seeding Full Blueprint Excel Data across System  ");
  console.log("==================================================");

  // 1. System Settings
  console.log("\n1. Seeding System Settings (Permissions & Privacy)...");
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

  // 2. White Label Organizations
  console.log("\n2. Seeding White Label Organizations...");
  const org1 = await prisma.organization.upsert({
    where: { code: "ORG-PLOTSNHOMES" },
    update: {},
    create: {
      name: "PlotsnHomes Enterprise",
      code: "ORG-PLOTSNHOMES",
      domain: "plotsnhomes.com",
      status: "ACTIVE",
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { code: "ORG-WL01" },
    update: {},
    create: {
      name: "BrickVest Global White Label",
      code: "ORG-WL01",
      domain: "brickvest-global.com",
      status: "ACTIVE",
    },
  });

  // 3. Franchises
  console.log("\n3. Seeding Franchises...");
  const fr1 = await prisma.franchise.upsert({
    where: { code: "FR-NORTH-01" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "North Region Franchise",
      code: "FR-NORTH-01",
      organizationId: org1.id,
      location: "North Region (Delhi NCR, Punjab, Haryana)",
      status: "ACTIVE",
    },
  });

  const fr2 = await prisma.franchise.upsert({
    where: { code: "FR-SOUTH-02" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "South Region Franchise",
      code: "FR-SOUTH-02",
      organizationId: org1.id,
      location: "South Region (Bangalore, Chennai, Hyderabad)",
      status: "ACTIVE",
    },
  });

  const fr3 = await prisma.franchise.upsert({
    where: { code: "FR-WEST-03" },
    update: {},
    create: {
      tenantId: org2.id,
      name: "West Coast Franchise",
      code: "FR-WEST-03",
      organizationId: org2.id,
      location: "West Coast (Mumbai, Pune, Ahmedabad)",
      status: "ACTIVE",
    },
  });

  // 4. Branches
  console.log("\n4. Seeding Branches...");
  const br1 = await prisma.branch.upsert({
    where: { code: "BR-DEL-CENTRAL" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Delhi Central Branch",
      code: "BR-DEL-CENTRAL",
      franchiseId: fr1.id,
      city: "New Delhi",
      status: "ACTIVE",
    },
  });

  const br2 = await prisma.branch.upsert({
    where: { code: "BR-BLR-TECH" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Bangalore Tech Hub Branch",
      code: "BR-BLR-TECH",
      franchiseId: fr2.id,
      city: "Bangalore",
      status: "ACTIVE",
    },
  });

  const br3 = await prisma.branch.upsert({
    where: { code: "BR-MUM-WEST" },
    update: {},
    create: {
      tenantId: org2.id,
      name: "Mumbai West Coast Branch",
      code: "BR-MUM-WEST",
      franchiseId: fr3.id,
      city: "Mumbai",
      status: "ACTIVE",
    },
  });

  // 5. Departments
  console.log("\n5. Seeding Departments...");
  const dept1 = await prisma.department.upsert({
    where: { code: "DEPT-SALES-CRM" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Sales & CRM Department",
      code: "DEPT-SALES-CRM",
      branchId: br1.id,
      status: "ACTIVE",
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { code: "DEPT-MKTG" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Digital Marketing & Alliances",
      code: "DEPT-MKTG",
      branchId: br2.id,
      status: "ACTIVE",
    },
  });

  const dept3 = await prisma.department.upsert({
    where: { code: "DEPT-CS" },
    update: {},
    create: {
      tenantId: org2.id,
      name: "Customer Success & Operations",
      code: "DEPT-CS",
      branchId: br3.id,
      status: "ACTIVE",
    },
  });

  // 6. Teams
  console.log("\n6. Seeding Teams...");
  const team1 = await prisma.team.upsert({
    where: { code: "TEAM-ALPHA" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Alpha Sales Team",
      code: "TEAM-ALPHA",
      departmentId: dept1.id,
      status: "ACTIVE",
    },
  });

  const team2 = await prisma.team.upsert({
    where: { code: "TEAM-BETA" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Beta High-Value Deals Team",
      code: "TEAM-BETA",
      departmentId: dept1.id,
      status: "ACTIVE",
    },
  });

  const team3 = await prisma.team.upsert({
    where: { code: "TEAM-ENT" },
    update: {},
    create: {
      tenantId: org1.id,
      name: "Enterprise Alliances Team",
      code: "TEAM-ENT",
      departmentId: dept2.id,
      status: "ACTIVE",
    },
  });

  console.log("✓ Enterprise Units seeded successfully.");

  // 7. Seed Property Categories
  console.log("\n7. Seeding Property Categories & Marketplace Categories...");
  const cat1 = await prisma.propertyCategory.upsert({
    where: { name: "Residential Plots" },
    update: {},
    create: {
      name: "Residential Plots",
      slug: "residential-plots",
      icon: "map-pin",
      description: "Gated plots and residential land parcels",
    },
  });

  const cat2 = await prisma.propertyCategory.upsert({
    where: { name: "Commercial Space" },
    update: {},
    create: {
      name: "Commercial Space",
      slug: "commercial-space",
      icon: "building",
      description: "Office spaces, IT parks, retail shops",
    },
  });

  const cat3 = await prisma.propertyCategory.upsert({
    where: { name: "Luxury Villas" },
    update: {},
    create: {
      name: "Luxury Villas",
      slug: "luxury-villas",
      icon: "home",
      description: "Independent luxury villas and farmhouses",
    },
  });

  // 8. Seed Sample Leads / Inquiries from Demo10 sheet
  console.log("\n8. Seeding CRM Leads & Inquiries from Blueprint...");
  const prop = await prisma.property.findFirst();
  if (prop) {
    const sampleLeads = [
      { name: "Rahul Sharma", company: "ABC Manufacturing", email: "rahul@example.com", phone: "9876543210", status: "NEW", source: "Website", notes: "Interested in 500 sqyd residential plot in Gurgaon" },
      { name: "Future School Trust", company: "Future School", email: "contact2@example.com", phone: "9000000002", status: "QUALIFIED", source: "Facebook", notes: "Institutional land inquiry in Bangalore" },
      { name: "TechCorp Solutions", company: "TechCorp", email: "techcorp@example.com", phone: "9876543212", status: "IN_PROGRESS", source: "Referral", notes: "Looking for 10,000 sqft commercial office in Mumbai" },
      { name: "Greenfield Builders", company: "Greenfield Infra", email: "greenfield@example.com", phone: "9876543213", status: "CONTACTED", source: "LinkedIn", notes: "Joint venture partnership inquiry" },
      { name: "Sunrise Infra", company: "Sunrise Group", email: "sunrise@example.com", phone: "9876543214", status: "NEGOTIATION", source: "Campaign", notes: "Negotiating price for North Region commercial hub" },
      { name: "Apex Properties", company: "Apex Corp", email: "apex@example.com", phone: "9876543215", status: "CLOSED_WON", source: "Direct", notes: "Deal closed for Luxury Villa plot" },
    ];

    for (const l of sampleLeads) {
      await prisma.inquiry.create({
        data: {
          tenantId: prop.tenantId,
          name: l.name,
          email: l.email,
          phone: l.phone,
          message: `${l.company} (${l.status}): ${l.notes}`,
          propertyId: prop.id,
        },
      }).catch(() => {});
    }
  }
  console.log("✓ CRM Leads & Inquiries seeded.");

  console.log("==================================================");
  console.log(" All Blueprint Excel Datasets Successfully Seeded! ");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Error seeding blueprint excel data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
