import { PrismaClient, Role, PropertyStatus, LeadStage, ShowingStatus, CommissionStatus, TransactionStatus, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding rich analytics data for dev.db...");

  const passwordHash = await bcrypt.hash("demo1234", 12);

  // Primary tenant for all seeded, tenant-owned rows.
  const primaryOrg = await prisma.organization.upsert({
    where: { code: "BRICKVEST" },
    create: { name: "BrickVest Demo", code: "BRICKVEST" },
    update: {},
  });
  const TENANT_ID = primaryOrg.id;

  // 1. Ensure Developers
  const devNames = [
    "Godrej Properties", "DLF Limited", "Tata Value Homes", "DAMAC Properties",
    "Casagrand", "Kohinoor Group", "Amanora", "Rohan Builders"
  ];
  const developers = [];
  for (const name of devNames) {
    const dev = await prisma.developer.upsert({
      where: { name },
      create: {
        tenantId: TENANT_ID,
        name,
        email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        phone: "+91 98000 11223",
        city: "Mumbai",
        state: "MH",
        country: "IN",
        projectCount: 5
      },
      update: {}
    });
    developers.push(dev);
  }

  // 2. Ensure Projects
  const projectDefs = [
    { name: "Godrej Sky Greens", devIdx: 0, city: "Pune", state: "MH", status: "Ongoing" },
    { name: "DLF Cyber City Towers", devIdx: 1, city: "Gurugram", state: "HR", status: "Ongoing" },
    { name: "Tata Sereno Luxe", devIdx: 2, city: "Bangalore", state: "KA", status: "Ongoing" },
    { name: "DAMAC Lagoons Oasis", devIdx: 3, city: "Dubai", state: "AE", status: "Upcoming" },
    { name: "Casagrand Zenith", devIdx: 4, city: "Chennai", state: "TN", status: "Completed" },
    { name: "Kohinoor Grandeur", devIdx: 5, city: "Pune", state: "MH", status: "Ongoing" },
    { name: "Amanora Park Towers", devIdx: 6, city: "Pune", state: "MH", status: "Ongoing" },
    { name: "Rohan Ananta", devIdx: 7, city: "Pune", state: "MH", status: "Completed" },
  ];

  const projects = [];
  for (const p of projectDefs) {
    const proj = await prisma.project.upsert({
      where: { id: `proj-${p.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}` },
      create: {
        tenantId: TENANT_ID,
        id: `proj-${p.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: p.name,
        developerId: developers[p.devIdx].id,
        city: p.city,
        state: p.state,
        status: p.status
      },
      update: {}
    });
    projects.push(proj);
  }

  // 3. Ensure Agents
  const agentData = [
    { name: "Sarah Mitchell", email: "agent1@brickvest.com", phone: "+91 98201 34567" },
    { name: "James Chen", email: "agent2@brickvest.com", phone: "+91 97300 22891" },
    { name: "Maria Lopez", email: "agent3@brickvest.com", phone: "+91 96780 45123" },
    { name: "David Kim", email: "agent4@brickvest.com", phone: "+91 98456 71234" },
    { name: "Emily Parker", email: "agent5@brickvest.com", phone: "+91 90000 12345" },
    { name: "Robert Walsh", email: "agent6@brickvest.com", phone: "+91 87654 32109" },
    { name: "Lisa Nguyen", email: "agent7@brickvest.com", phone: "+91 99887 65432" },
    { name: "Michael Torres", email: "agent8@brickvest.com", phone: "+91 98765 11223" },
    { name: "Anna Becker", email: "agent9@brickvest.com", phone: "+91 76543 21098" },
    { name: "Chris Johnson", email: "agent10@brickvest.com", phone: "+91 98123 45670" }
  ];

  const agents = [];
  for (const a of agentData) {
    const ag = await prisma.user.upsert({
      where: { email: a.email },
      create: {
        email: a.email,
        name: a.name,
        phone: a.phone,
        passwordHash,
        role: Role.AGENT,
        active: true,
        commissionRate: 3.0,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 300) * 24 * 60 * 60 * 1000)
      },
      update: { role: Role.AGENT }
    });
    agents.push(ag);
  }

  // 4. Ensure Customers/Buyers
  const customerData = [
    { name: "Rajesh Kumar", email: "rajesh.kumar@gmail.com", phone: "+91 98111 22334", city: "Mumbai", state: "MH" },
    { name: "Anita Sharma", email: "anita.s@outlook.com", phone: "+91 98222 33445", city: "Delhi", state: "DL" },
    { name: "Vikram Malhotra", email: "v.malhotra@yahoo.com", phone: "+91 98333 44556", city: "Bangalore", state: "KA" },
    { name: "Pooja Reddy", email: "pooja.reddy@gmail.com", phone: "+91 98444 55667", city: "Hyderabad", state: "TS" },
    { name: "Amit Patel", email: "apatel@techcorp.com", phone: "+91 98555 66778", city: "Ahmedabad", state: "GJ" },
    { name: "Siddharth Joshi", email: "sid.joshi@gmail.com", phone: "+91 98666 77889", city: "Pune", state: "MH" },
    { name: "Meera Nair", email: "meera.nair@hotmail.com", phone: "+91 98777 88990", city: "Kochi", state: "KL" },
    { name: "Rohan Deshmukh", email: "rohan.d@gmail.com", phone: "+91 98888 99001", city: "Pune", state: "MH" },
    { name: "Tanya Sen", email: "tanya.sen@gmail.com", phone: "+91 98999 00112", city: "Kolkata", state: "WB" },
    { name: "Sunil Verma", email: "sunil.verma@yahoo.com", phone: "+91 99000 11223", city: "Chandigarh", state: "PB" }
  ];

  const customers = [];
  for (const c of customerData) {
    const cust = await prisma.user.upsert({
      where: { email: c.email },
      create: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        city: c.city,
        state: c.state,
        passwordHash,
        role: Role.BUYER,
        active: true,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 200) * 24 * 60 * 60 * 1000)
      },
      update: { role: Role.BUYER }
    });
    customers.push(cust);
  }

  // 5. Assign properties to Projects and Agents if missing
  const allProperties = await prisma.property.findMany();
  for (let i = 0; i < allProperties.length; i++) {
    const prop = allProperties[i];
    const proj = projects[i % projects.length];
    const ag = agents[i % agents.length];
    const dev = developers[i % developers.length];
    
    // Assign dates across past 12 months
    const daysAgo = (i * 3) % 360;
    const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Randomize status for realistic inventory distribution
    let status: PropertyStatus = PropertyStatus.ACTIVE;
    if (i % 6 === 0) status = PropertyStatus.SOLD;
    else if (i % 8 === 0) status = PropertyStatus.PENDING;
    else if (i % 12 === 0) status = PropertyStatus.RENTED;
    else if (i % 15 === 0) status = PropertyStatus.DRAFT;

    await prisma.property.update({
      where: { id: prop.id },
      data: {
        projectId: proj.id,
        developerId: dev.id,
        agentId: ag.id,
        status: status,
        createdAt: createdDate,
        volumeScore: 100 + (i * 47) % 850
      }
    });
  }

  // 6. Generate rich Leads across past 365 days
  const sources = ["Website", "Facebook Ads", "99acres", "MagicBricks", "Referral", "Google Ads"];
  const stages = [LeadStage.NEW, LeadStage.CONTACTED, LeadStage.QUALIFIED, LeadStage.SITE_VISIT, LeadStage.NEGOTIATION, LeadStage.WON, LeadStage.LOST];
  
  const leadCount = await prisma.lead.count();
  if (leadCount < 100) {
    for (let i = 0; i < 120; i++) {
      const source = sources[i % sources.length];
      const stage = stages[i % stages.length];
      const ag = agents[i % agents.length];
      const prop = allProperties[i % allProperties.length];
      const cust = customers[i % customers.length];
      
      const daysAgo = (i * 3) % 360;
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const isOverdue = i % 4 === 0;
      const followUpDate = isOverdue
        ? new Date(Date.now() - (1 + (i % 5)) * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + (1 + (i % 7)) * 24 * 60 * 60 * 1000);

      await prisma.lead.create({
        data: {
          tenantId: prop.tenantId,
          name: `Lead ${cust.name} ${i + 1}`,
          email: `lead_${i + 1}_${cust.email}`,
          phone: `+91 99${String(10000000 + i * 391).slice(-8)}`,
          source,
          stage,
          score: 50 + (i % 45),
          budgetMin: 3000000 + (i % 10) * 500000,
          budgetMax: 6000000 + (i % 10) * 1000000,
          ownerId: ag.id,
          propertyId: prop.id,
          nextFollowUpAt: stage === LeadStage.WON || stage === LeadStage.LOST ? null : followUpDate,
          createdAt: createdDate
        }
      });
    }
    console.log("Seeded 120 rich leads.");
  }

  // 7. Seed Transactions & Completed Sales
  const txCount = await prisma.transaction.count();
  if (txCount < 50) {
    const sampleProperties = await prisma.property.findMany({ take: 60 });
    for (let i = 0; i < 50; i++) {
      const prop = sampleProperties[i % sampleProperties.length];
      const cust = customers[i % customers.length];
      const ag = agents[i % agents.length];

      const daysAgo = (i * 7) % 350;
      const txDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const amount = Math.round((prop.price * (0.1 + (i % 9) * 0.1)));
      const isCompleted = i % 5 !== 0;

      const tx = await prisma.transaction.create({
        data: {
          tenantId: prop.tenantId,
          userId: cust.id,
          propertyId: prop.id,
          amount,
          type: i % 2 === 0 ? TransactionType.INVESTMENT : TransactionType.DEPOSIT,
          status: isCompleted ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          paymentMethod: ["Bank Transfer", "UPI", "Razorpay", "Cheque"][i % 4],
          createdAt: txDate,
          completedAt: isCompleted ? txDate : null,
          buyerName: cust.name,
          sellerName: "PlotsnHomes Developer"
        }
      });

      // Create corresponding AgentCommission
      if (isCompleted) {
        const commPct = ag.commissionRate ?? 3.0;
        const commAmount = Math.round((amount * commPct) / 100);
        const isPaid = i % 3 === 0;

        await prisma.agentCommission.create({
          data: {
            tenantId: prop.tenantId,
            agentId: ag.id,
            propertyId: prop.id,
            transactionId: tx.id,
            propertyTitle: prop.title,
            propertyValue: prop.price,
            commissionPct: commPct,
            commissionAmount: commAmount,
            status: isPaid ? CommissionStatus.PAID : CommissionStatus.PENDING,
            paidAt: isPaid ? txDate : null,
            soldAt: txDate,
            createdAt: txDate
          }
        });
      }
    }
    console.log("Seeded 50 transactions & agent commissions.");
  }

  // 8. Seed Site Visits (PropertyShowing)
  const showingCount = await prisma.propertyShowing.count();
  if (showingCount < 60) {
    const sampleProperties = await prisma.property.findMany({ take: 30 });
    const showingStatuses = [ShowingStatus.REQUESTED, ShowingStatus.CONFIRMED, ShowingStatus.COMPLETED, ShowingStatus.CANCELLED];

    for (let i = 0; i < 60; i++) {
      const prop = sampleProperties[i % sampleProperties.length];
      const cust = customers[i % customers.length];
      const st = showingStatuses[i % showingStatuses.length];

      const daysOffset = (i % 2 === 0 ? -1 : 1) * ((i * 4) % 120);
      const tourDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
      const createdDate = new Date(Date.now() - ((i * 3) % 200) * 24 * 60 * 60 * 1000);

      await prisma.propertyShowing.create({
        data: {
          tenantId: prop.tenantId,
          propertyId: prop.id,
          userId: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          tourDate,
          tourTime: ["10:00 AM", "02:00 PM", "04:30 PM", "11:30 AM"][i % 4],
          tourType: i % 3 === 0 ? "VIRTUAL" : "IN_PERSON",
          status: st,
          message: `Looking to inspect ${prop.title} with family`,
          createdAt: createdDate
        }
      });
    }
    console.log("Seeded 60 site visits (PropertyShowing).");
  }

  // 9. Ensure CRM Goals
  await prisma.crmGoal.upsert({
    where: { id: "goal-annual-revenue" },
    create: {
      tenantId: TENANT_ID,
      id: "goal-annual-revenue",
      title: "Annual Revenue Target FY26",
      target: 250000000,
      current: 185000000,
      period: "yearly"
    },
    update: { current: 185000000 }
  });

  await prisma.crmGoal.upsert({
    where: { id: "goal-monthly-leads" },
    create: {
      tenantId: TENANT_ID,
      id: "goal-monthly-leads",
      title: "Monthly Lead Generation Target",
      target: 300,
      current: 245,
      period: "monthly"
    },
    update: { current: 245 }
  });

  console.log("Analytics data seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding analytics data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
