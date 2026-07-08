import {
  PrismaClient,
  ListingType,
  LeadStage,
  PropertyStatus,
  PropertyType,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  computeChangesFromHistory,
  generatePriceHistory,
} from "../src/lib/market";

const prisma = new PrismaClient();

const IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
];

const CATEGORIES = ["Apartment", "Villa", "Penthouse", "Townhouse", "Duplex", "Full Floor", "Commercial", "Land", "Plot"];
const AREAS = ["Downtown", "Marina", "Business Bay", "Dubai Hills Estate", "Palm Jumeirah", "Al Furjan", "Jumeirah", "DIFC"];
const CORE_AMENITIES = [
  "Chair Accessible",
  "Elevator",
  "Pool",
  "Ventilation",
  "Washer and dryer",
  "Water",
  "WiFi",
];
const EXTRA_FEATURES = ["Gym", "Sea View", "Gated Community", "City View", "Parking", "Balcony", "Smart Home"];

const DUBAI_CITIES: { city: string; state: string; zip: string; priceMul: number; lat: number; lng: number }[] = [
  { city: "Dubai", state: "AE", zip: "00000", priceMul: 1.4, lat: 25.2048, lng: 55.2708 },
  { city: "Abu Dhabi", state: "AE", zip: "00001", priceMul: 1.2, lat: 24.4539, lng: 54.3773 },
  { city: "Austin", state: "TX", zip: "78701", priceMul: 1.0, lat: 30.2672, lng: -97.7431 },
  { city: "Dallas", state: "TX", zip: "75201", priceMul: 0.95, lat: 32.7767, lng: -96.7970 },
  { city: "Houston", state: "TX", zip: "77002", priceMul: 0.88, lat: 29.7604, lng: -95.3698 },
  { city: "Miami", state: "FL", zip: "33139", priceMul: 1.35, lat: 25.7617, lng: -80.1918 },
  { city: "Tampa", state: "FL", zip: "33602", priceMul: 1.1, lat: 27.9506, lng: -82.4572 },
  { city: "Orlando", state: "FL", zip: "32801", priceMul: 1.05, lat: 28.5383, lng: -81.3792 },
  { city: "Phoenix", state: "AZ", zip: "85004", priceMul: 0.92, lat: 33.4484, lng: -112.0740 },
  { city: "Scottsdale", state: "AZ", zip: "85251", priceMul: 1.25, lat: 33.4942, lng: -111.9261 },
  { city: "Denver", state: "CO", zip: "80202", priceMul: 1.15, lat: 39.7392, lng: -104.9903 },
  { city: "Nashville", state: "TN", zip: "37203", priceMul: 1.08, lat: 36.1627, lng: -86.7816 },
  { city: "Atlanta", state: "GA", zip: "30303", priceMul: 0.98, lat: 33.7490, lng: -84.3880 },
  { city: "Charlotte", state: "NC", zip: "28202", priceMul: 0.94, lat: 35.2271, lng: -80.8431 },
  { city: "Raleigh", state: "NC", zip: "27601", priceMul: 1.02, lat: 35.7796, lng: -78.6382 },
  { city: "Chicago", state: "IL", zip: "60601", priceMul: 1.2, lat: 41.8781, lng: -87.6298 },
  { city: "Boston", state: "MA", zip: "02108", priceMul: 1.45, lat: 42.3601, lng: -71.0589 },
  { city: "Seattle", state: "WA", zip: "98101", priceMul: 1.38, lat: 47.6062, lng: -122.3321 },
  { city: "Portland", state: "OR", zip: "97201", priceMul: 1.12, lat: 45.5051, lng: -122.6750 },
  { city: "Las Vegas", state: "NV", zip: "89101", priceMul: 0.9, lat: 36.1699, lng: -115.1398 },
  { city: "San Diego", state: "CA", zip: "92101", priceMul: 1.55, lat: 32.7157, lng: -117.1611 },
  { city: "Los Angeles", state: "CA", zip: "90012", priceMul: 1.65, lat: 34.0522, lng: -118.2437 },
  { city: "San Francisco", state: "CA", zip: "94102", priceMul: 1.85, lat: 37.7749, lng: -122.4194 },
  { city: "New York", state: "NY", zip: "10001", priceMul: 1.9, lat: 40.7128, lng: -74.0060 },
  { city: "Brooklyn", state: "NY", zip: "11201", priceMul: 1.75, lat: 40.6782, lng: -73.9442 },
  { city: "Philadelphia", state: "PA", zip: "19102", priceMul: 1.05, lat: 39.9526, lng: -75.1652 },
  { city: "Detroit", state: "MI", zip: "48226", priceMul: 0.65, lat: 42.3314, lng: -83.0458 },
];

const CITIES = DUBAI_CITIES;

const TYPES: PropertyType[] = [
  PropertyType.RESIDENTIAL,
  PropertyType.RESIDENTIAL,
  PropertyType.RESIDENTIAL,
  PropertyType.RENTAL,
  PropertyType.COMMERCIAL,
  PropertyType.LAND,
];

const STREETS = [
  "Oak", "Maple", "Cedar", "Pine", "Lakeview", "Sunset", "Park", "Main",
  "Broadway", "Market", "Highland", "River", "Valley", "Summit", "Harbor",
];

const RATINGS = ["A+", "A", "A-", "B+", "B", "B-", "C+"];
const PROPERTY_VIDEOS = [
  "https://player.vimeo.com/video/410854901",
  "https://player.vimeo.com/video/599795682",
  "https://player.vimeo.com/video/393652386",
  "https://player.vimeo.com/video/328817122",
  "https://player.vimeo.com/video/427173299",
  "https://player.vimeo.com/video/357274789",
  "https://player.vimeo.com/video/446355885",
  "https://player.vimeo.com/video/76979871",
  "https://player.vimeo.com/video/289729765",
  "https://player.vimeo.com/video/22439234",
  "https://player.vimeo.com/video/148751763",
  "https://player.vimeo.com/video/1084537",
];

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

async function main() {
  const RESET_DB = process.env.SEED_RESET === "1";

  if (RESET_DB) {
    // Delete in dependency order (children before parents)
    await prisma.propertyShowing.deleteMany();
    await prisma.leadTask.deleteMany();
    await prisma.leadActivity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.loanApplication.deleteMany();
    await prisma.kycProfile.deleteMany();
    await prisma.messageLog.deleteMany();
    await prisma.emailLog.deleteMany();
    await prisma.meetingInvite.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.inquiry.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.userSubscription.deleteMany();
    await prisma.crmGoal.deleteMany();
    await prisma.bulkJob.deleteMany();
    await prisma.brokerageInvoice.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
    await prisma.developerTask.deleteMany();
    await prisma.developer.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
  } else {
    console.log("Seed running in preserve mode (SEED_RESET!=1): existing users/properties will not be deleted.");
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@plotsnhomes.com" },
    create: {
      email: "admin@plotsnhomes.com",
      name: "Admin User",
      phone: "+91 98765 40100",
      passwordHash,
      role: Role.SUPERADMIN,
      active: true,
    },
    update: {
      name: "Admin User",
      phone: "+91 98765 40100",
      passwordHash,
      role: Role.SUPERADMIN,
      active: true,
    },
  });

  const agentNames = [
    "Sarah Mitchell", "James Chen", "Maria Lopez", "David Kim",
    "Emily Parker", "Robert Walsh", "Lisa Nguyen", "Michael Torres",
    "Anna Becker", "Chris Johnson",
  ];

  // Realistic Indian mobile numbers for agents (10-digit, starting with 9/8/7/6)
  const agentPhones = [
    "+91 98201 34567", "+91 97300 22891", "+91 96780 45123", "+91 98456 71234",
    "+91 90000 12345", "+91 87654 32109", "+91 99887 65432", "+91 98765 11223",
    "+91 76543 21098", "+91 98123 45670",
  ];

  const agents = await Promise.all(
    agentNames.map((name, i) =>
      prisma.user.upsert({
        where: { email: `agent${i + 1}@plotsnhomes.com` },
        create: {
          email: `agent${i + 1}@plotsnhomes.com`,
          name,
          phone: agentPhones[i],
          passwordHash,
          role: Role.AGENT,
          active: true,
        },
        update: {
          name,
          phone: agentPhones[i],
          passwordHash,
          role: Role.AGENT,
          active: true,
        },
      })
    )
  );

  const investor = await prisma.user.upsert({
    where: { email: "investor@plotsnhomes.com" },
    create: {
      email: "investor@plotsnhomes.com",
      name: "James Kapoor",
      phone: "+91 98200 34567",
      passwordHash,
      role: Role.BUYER,
      active: true,
    },
    update: {
      name: "James Kapoor",
      phone: "+91 98200 34567",
      passwordHash,
      role: Role.BUYER,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "buyer@plotsnhomes.com" },
    create: {
      email: "buyer@plotsnhomes.com",
      name: "Emily Sharma",
      phone: "+91 97654 32100",
      passwordHash,
      role: Role.BUYER,
      active: true,
    },
    update: {
      name: "Emily Sharma",
      phone: "+91 97654 32100",
      passwordHash,
      role: Role.BUYER,
      active: true,
    },
  });

  const TOTAL = 220;
  const existingPropertyCount = await prisma.property.count();
  const batch: import("@prisma/client").Prisma.PropertyUncheckedCreateInput[] = [];

  if (RESET_DB || existingPropertyCount === 0) {
    for (let i = 0; i < TOTAL; i++) {
    const loc = pick(CITIES, i);
    const type = pick(TYPES, i);
    const beds = type === PropertyType.LAND ? 0 : type === PropertyType.COMMERCIAL ? 0 : 1 + (i % 5);
    // Bathrooms: whole numbers only (1, 2, 3, 4) — no 2.5 baths
    const baths = type === PropertyType.LAND ? 0 : 1 + (i % 4);
    const sqft =
      type === PropertyType.LAND
        ? 5000 + (i % 20) * 1000
        : type === PropertyType.COMMERCIAL
          ? 3000 + (i % 15) * 500
          : 900 + (i % 12) * 180;

    const basePrice = Math.round(
      (180000 + (i % 40) * 25000 + (beds * 35000)) * loc.priceMul
    );
    const rentMonthly =
      type === PropertyType.LAND
        ? null
        : Math.round(basePrice * (0.004 + (i % 10) * 0.0003));

    const history = generatePriceHistory(basePrice, 30);
    const changes = computeChangesFromHistory(history);
    const annualRent = (rentMonthly ?? basePrice * 0.005) * 12;
    const yieldRate = (annualRent / basePrice) * 100;
    const capRate = yieldRate * (0.85 + (i % 5) * 0.02);
    const pricePerSqft = sqft > 0 ? basePrice / sqft : null;

    const symbol = `BV-${loc.state}-${String(i + 1).padStart(4, "0")}`;
    const street = pick(STREETS, i);
    const category = pick(CATEGORIES, i);
    const area = pick(AREAS, i);
    const listingType = i % 7 === 0 ? ListingType.RENT : ListingType.SALE;
    const title =
      i < 12
        ? `${category} in ${area}, ${loc.city}`
        : `${type === PropertyType.COMMERCIAL ? "Commercial" : type === PropertyType.LAND ? "Land parcel" : beds + "BR"} — ${loc.city}, ${loc.state}`;
    const slug = slugify(`${symbol}-${title}`);
    const imageSet = [
      pick(IMAGES, i),
      pick(IMAGES, i + 1),
      pick(IMAGES, i + 2),
      pick(IMAGES, i + 3),
      pick(IMAGES, i + 4),
      pick(IMAGES, i + 5),
    ];

    // Rich, varied property descriptions by category
    const descriptionMap: Record<string, string> = {
      Apartment: `Elegantly designed ${beds}-bedroom apartment in the heart of ${area}, ${loc.city}. Features floor-to-ceiling windows, modern open-plan kitchen, and premium finishes throughout. Managed by PlotsnHomes, symbol ${symbol} delivers consistent rental yield tracked live on the platform.`,
      Villa: `Stunning ${beds}-bedroom private villa in ${area}, ${loc.city} — offering expansive living spaces, a landscaped garden, and a private swimming pool. This investment-grade asset has a strong rental history and premium cap rate. Symbol: ${symbol}.`,
      Penthouse: `Exclusive ${beds}-bedroom penthouse crowning ${area}'s skyline in ${loc.city}. Panoramic city views, private terrace, chef's kitchen, and ultra-luxury interiors. A trophy asset for discerning investors — PlotsnHomes symbol ${symbol}.`,
      Townhouse: `Contemporary ${beds}-bedroom townhouse in the sought-after ${area} neighbourhood, ${loc.city}. Spanning multiple levels with private parking, landscaped patio, and smart home integration. Symbol ${symbol} on PlotsnHomes exchange.`,
      Duplex: `Architecturally designed ${beds}-bedroom duplex in ${area}, ${loc.city} — ideal for end-users and investors alike. Features double-height ceilings, modern fixtures, and strong rental demand. Listed as ${symbol} on PlotsnHomes.`,
      "Full Floor": `Premium full-floor ${beds}-bedroom residence on a high floor in ${area}, ${loc.city}. Unobstructed panoramic views, dedicated lift lobby, concierge service, and high-end amenities. PlotsnHomes listing: ${symbol}.`,
      Commercial: `Prime commercial space in ${area}'s business district, ${loc.city}. ${sqft.toLocaleString()} sq ft of Grade-A office space with 24/7 security, fibre connectivity, and central HVAC. High-yield asset — symbol ${symbol}.`,
      Land: `Strategically located ${(sqft / 43560).toFixed(2)}-acre land parcel in ${area}, ${loc.city}. Zoned for ${loc.state === "AE" ? "mixed-use development" : "residential or commercial construction"} with utility connections in place. Development potential — ${symbol}.`,
      Plot: `Ready-to-build residential plot in ${area}, ${loc.city}. Clean title, all approvals in place, and excellent connectivity to major arterials. A rare land investment opportunity — PlotsnHomes symbol ${symbol}.`,
    };
    const description = descriptionMap[category] ?? `Investment-grade ${category.toLowerCase()} in ${area}, ${loc.city}. Symbol ${symbol} tracks live yield, cap rate, and market performance on the PlotsnHomes exchange.`;

      batch.push({
      symbol,
      title,
      slug,
      description,
      price: basePrice,
      rentMonthly,
      bedrooms: beds,
      bathrooms: baths,
      sqft,
      address: `${100 + (i % 900)} ${street} St`,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      type,
      status: PropertyStatus.ACTIVE,
      images: JSON.stringify(imageSet),
      listingType,
      category,
      area,
      rooms: beds + 2 + (i % 4),
      garages: 1 + (i % 4),
      lotSize: sqft ? sqft + 500 : null,
      totalFloors: type === PropertyType.LAND ? null : 4 + (i % 50),
      floorNumber: type === PropertyType.LAND ? null : 1 + (i % 20),
      country: loc.state === "AE" ? "AE" : "IN",
      features: JSON.stringify([
        ...CORE_AMENITIES,
        ...EXTRA_FEATURES.slice(0, 1 + (i % EXTRA_FEATURES.length)),
      ]),
      videos: JSON.stringify([
        PROPERTY_VIDEOS[i % PROPERTY_VIDEOS.length],
      ]),
      videoUrl: PROPERTY_VIDEOS[(i + 5) % PROPERTY_VIDEOS.length],
      // Real working Matterport demo tours (verified public demos)
      virtualTourUrl: i < 8 ? [
        "https://my.matterport.com/show/?m=SxQL3iGyvTM",
        "https://my.matterport.com/show/?m=aSx1MpRRqif",
        "https://my.matterport.com/show/?m=NR6aJ6RXsZT",
        "https://my.matterport.com/show/?m=oh2rCd8TLNB",
        "https://my.matterport.com/show/?m=2qRBFYtqmAQ",
        "https://my.matterport.com/show/?m=i7YkJBNagQr",
        "https://my.matterport.com/show/?m=dD7sRKLMEBi",
        "https://my.matterport.com/show/?m=E9bMoN2G4hH",
      ][i] : null,
      // Real coordinates for every city
      mapLat: loc.lat + (i % 10) * 0.005,
      mapLng: loc.lng + (i % 10) * 0.005,
      pdfs: JSON.stringify(
        i < 8 ? [{ name: "Floor Plan.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }] : []
      ),
      featured: i < 12,
      yearBuilt: 1985 + (i % 38),
      yieldRate: Math.round(yieldRate * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      interestRate: 5.5 + (i % 8) * 0.25,
      change24h: Math.round(changes.change24h * 100) / 100,
      change7d: Math.round(changes.change7d * 100) / 100,
      changeYtd: Math.round(changes.changeYtd * 100) / 100,
      pricePerSqft: pricePerSqft ? Math.round(pricePerSqft * 100) / 100 : null,
      priceHistory: JSON.stringify(history),
      marketRating: pick(RATINGS, i % RATINGS.length),
      volumeScore: 50 + (i % 150),
      agentId: pick(agents, i).id,
      });
    }

    for (let i = 0; i < batch.length; i += 50) {
      const chunk = batch.slice(i, i + 50);
      for (const data of chunk) {
        await prisma.property.create({ data });
      }
      console.log(`Seeded properties ${Math.min(i + 50, TOTAL)} / ${TOTAL}`);
    }
  } else {
    console.log(`Skipping property creation (${existingPropertyCount} existing properties found).`);
  }

  const firstProperty = await prisma.property.findFirst();
  const transactionCount = await prisma.transaction.count();
  const inquiryCount = await prisma.inquiry.count();
  if (firstProperty && (RESET_DB || transactionCount === 0)) {
    await prisma.transaction.create({
      data: {
        userId: investor.id,
        propertyId: firstProperty.id,
        amount: Math.round(firstProperty.price * 0.1),
        type: "DEPOSIT",
        status: "COMPLETED",
        description: "Demo completed deposit",
      },
    });
  }
  if (firstProperty && (RESET_DB || inquiryCount === 0)) {
    await prisma.inquiry.create({
        data: {
          propertyId: firstProperty.id,
          userId: investor.id,
          name: investor.name,
          email: investor.email,
          message: "Interested in scheduling a tour and reviewing yield projections.",
        },
      });
  }

  const leadStages = [
    LeadStage.NEW,
    LeadStage.CONTACTED,
    LeadStage.QUALIFIED,
    LeadStage.SITE_VISIT,
    LeadStage.NEGOTIATION,
    LeadStage.WON,
    LeadStage.LOST,
  ];
  const leadNames = [
    "Rahul Mehta",
    "Aarav Sharma",
    "Neha Kapoor",
    "Priya Singh",
    "Rohan Verma",
    "Karan Malhotra",
    "Sneha Patel",
  ];
  // Realistic email addresses based on actual lead names
  const leadEmails = [
    "rahul.mehta92@gmail.com",
    "aarav.sharma@outlook.com",
    "neha.kapoor2024@gmail.com",
    "priya.singh.inv@yahoo.in",
    "rohan.verma.re@gmail.com",
    "karan.malhotra@hotmail.com",
    "sneha.patel.homes@gmail.com",
  ];
  // Realistic lead notes
  const leadNotes = [
    "Looking for a 3BHK in a gated community. Budget flexible for the right property.",
    "First-time investor. Interested in rental yield properties near metro stations.",
    "Upgrading from a 2BHK. Ready to close within 60 days if terms are right.",
    "NRI buyer, prefers premium apartments with good resale value.",
    "Looking for commercial property for personal business use.",
    "End-user buyer, wants possession within 6 months. Loan pre-approved.",
    "High-net-worth individual looking for a luxury villa or penthouse.",
  ];
  const lifecycleStages = [
    "Lead", "MQL (Marketing Qualified Lead)", "SQL (Sales Qualified Lead)",
    "Lead", "Opportunity", "Subscriber", "Lead",
  ];
  const leadStatuses = [
    "New", "Calling Attempt", "Answered", "In Progress",
    "Site Visit", "EOI (Expression of Interest) shared", "Open",
  ];
  const existingLeadCount = await prisma.lead.count();
  if (RESET_DB || existingLeadCount === 0) {
    const sampleProperties = await prisma.property.findMany({ take: 12, orderBy: { createdAt: "asc" } });
    for (let i = 0; i < 24; i++) {
      const owner = agents[i % agents.length];
      const prop = sampleProperties[i % sampleProperties.length];
      const nameIdx = i % leadNames.length;
      const lead = await prisma.lead.create({
        data: {
          name: leadNames[nameIdx],
          email: leadEmails[nameIdx],
          phone: `+91 9${[8,7,6,9][i % 4]}${String(10000000 + i * 137).slice(-8)}`,
          source: ["Website", "Facebook Ads", "99acres", "MagicBricks", "Referral"][i % 5],
          stage: leadStages[i % leadStages.length],
          score: 40 + (i % 60),
          budgetMin: 200000 + i * 10000,
          budgetMax: 400000 + i * 20000,
          notes: leadNotes[nameIdx],
          lifecycleStage: lifecycleStages[nameIdx],
          leadStatus: leadStatuses[nameIdx],
          ownerId: owner.id,
          propertyId: prop?.id,
          nextFollowUpAt:
            i % 3 === 0
              ? new Date(Date.now() - ((i % 5) + 1) * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + (i % 7) * 24 * 60 * 60 * 1000),
        },
      });
      const activityMessages = [
        "Lead qualified after initial call. Showed strong interest in 3BHK units.",
        "WhatsApp conversation initiated. Sent property brochure and floor plans.",
        "Site visit scheduled. Lead confirmed availability for this weekend.",
        "Follow-up call completed. Lead requested pricing for premium floor.",
      ];
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: owner.id,
          type: ["NOTE", "CALL", "MEETING", "NOTE"][i % 4],
          message: activityMessages[i % activityMessages.length],
        },
      });
      await prisma.leadTask.create({
        data: {
          leadId: lead.id,
          userId: owner.id,
          title: ["Call lead and schedule site visit", "Send payment plan brochure", "Follow up after site visit", "Share EOI form with lead"][i % 4],
          dueAt: new Date(Date.now() + ((i % 4) + 1) * 24 * 60 * 60 * 1000),
        },
      });
    }
  } else {
    console.log(`Skipping lead creation (${existingLeadCount} existing leads found).`);
    const now = new Date();
    const overdueCount = await prisma.lead.count({
      where: {
        nextFollowUpAt: { lt: now },
        stage: { notIn: [LeadStage.WON, LeadStage.LOST] },
      },
    });
    if (overdueCount === 0) {
      const fixOverdue = await prisma.lead.findMany({
        where: { stage: { notIn: [LeadStage.WON, LeadStage.LOST] } },
        take: 8,
        orderBy: { createdAt: "asc" },
      });
      for (const lead of fixOverdue) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { nextFollowUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        });
      }
      console.log(`Set ${fixOverdue.length} leads with overdue follow-ups for CRM demos.`);
    }
    const wonCount = await prisma.lead.count({ where: { stage: LeadStage.WON } });
    if (wonCount < 2) {
      const toWin = await prisma.lead.findMany({
        where: { stage: { notIn: [LeadStage.WON, LeadStage.LOST] } },
        take: 4 - wonCount,
      });
      for (const lead of toWin) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { stage: LeadStage.WON },
        });
      }
      console.log(`Marked ${toWin.length} leads as WON for CRM demos.`);
    }
  }

  const devCount = await prisma.developer.count();
  if (RESET_DB || devCount === 0) {
    const devNames = [
      "GODREJ",
      "DLF",
      "TATA VALUE HOMES",
      "Rohan Builders",
      "Casagrand",
      "Kohinoor",
      "DAMAC",
      "Amanora",
    ];
    for (const name of devNames) {
      await prisma.developer.upsert({
        where: { name },
        create: { name, projectCount: Math.floor(Math.random() * 4) },
        update: {},
      });
    }
    console.log(`Seeded ${devNames.length} developers.`);

    // Seed sample tasks for first two developers
    const sampleTaskDevelopers = ["GODREJ", "DLF"];
    for (const devName of sampleTaskDevelopers) {
      const dev = await prisma.developer.findUnique({ where: { name: devName } });
      if (dev) {
        const existing = await prisma.developerTask.count({ where: { developerId: dev.id } });
        if (existing === 0) {
          const now = new Date();
          await prisma.developerTask.createMany({
            data: [
              {
                developerId: dev.id,
                title: "Submit Q3 project completion report",
                description: "Provide unit-wise status, pending OC/CC details, and revised handover schedule.",
                priority: "HIGH",
                status: "TODO",
                deadline: new Date(now.getFullYear(), now.getMonth() + 1, 10),
              },
              {
                developerId: dev.id,
                title: "Share updated RERA compliance documents",
                description: "Upload latest RERA registration certificate and quarterly progress report to the portal.",
                priority: "URGENT",
                status: "IN_PROGRESS",
                deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
              },
              {
                developerId: dev.id,
                title: "Review brokerage invoice for Phase 2 bookings",
                description: "Cross-check invoice amounts, commission rates, and GST breakdowns.",
                priority: "MEDIUM",
                status: "TODO",
                deadline: new Date(now.getFullYear(), now.getMonth() + 1, 20),
              },
              {
                developerId: dev.id,
                title: "Confirm site visit schedule for VIP buyer",
                description: "Coordinate with site team and confirm timings for premium floor unit inspection.",
                priority: "HIGH",
                status: "DONE",
                deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
                completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
              },
            ],
          });
        }
      }
    }
    console.log("Seeded sample developer tasks.");
  }

  const invCount = await prisma.brokerageInvoice.count();
  const year = new Date().getFullYear();

  async function createRichInvoice(
    seq: number,
    data: {
      bookingId: string;
      bookingName: string;
      brokerageName: string;
      invoiceTo: string;
      totalAmount: number;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
      commissionPct: number;
      status: string;
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string;
      buyerAddress: string;
      agentName: string;
      agentEmail: string;
      agentPhone: string;
      propertySymbol: string;
      propertyTitle: string;
      propertyAddress: string;
      lineItemsJson: string;
      notes: string;
      paid?: boolean;
    }
  ) {
    await prisma.brokerageInvoice.create({
      data: {
        invoiceNumber: `BV-INV-${year}-${String(seq).padStart(5, "0")}`,
        bookingId: data.bookingId,
        bookingName: data.bookingName,
        brokerageName: data.brokerageName,
        invoiceTo: data.invoiceTo,
        status: data.status,
        totalAmount: data.totalAmount,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        commissionPct: data.commissionPct,
        dueOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: data.paid ? new Date() : null,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerAddress: data.buyerAddress,
        agentName: data.agentName,
        agentEmail: data.agentEmail,
        agentPhone: data.agentPhone,
        propertySymbol: data.propertySymbol,
        propertyTitle: data.propertyTitle,
        propertyAddress: data.propertyAddress,
        lineItemsJson: data.lineItemsJson,
        notes: data.notes,
      },
    });
  }

  if (RESET_DB || invCount === 0) {
    await createRichInvoice(1, {
      bookingId: "BV-BK-2024",
      bookingName: "James Investor",
      brokerageName: "PlotsnHomes Realty",
      invoiceTo: "Buyer",
      subtotal: 118750,
      taxRate: 5,
      taxAmount: 6250,
      totalAmount: 125000,
      commissionPct: 2,
      status: "Paid",
      paid: true,
      buyerName: "James Investor",
      buyerEmail: "james.investor@example.com",
      buyerPhone: "+1 555 0101",
      buyerAddress: "1200 Market St, San Francisco, CA 94103",
      agentName: "Alex Morgan",
      agentEmail: "agent1@plotsnhomes.com",
      agentPhone: "+1 555 0201",
      propertySymbol: "BV-CA-0022",
      propertyTitle: "Marina Bay Residences — Tower A",
      propertyAddress: "88 Embarcadero, San Francisco, CA",
      lineItemsJson: JSON.stringify([
        { description: "Property booking deposit", qty: 1, rate: 100000, amount: 100000 },
        { description: "Brokerage facilitation fee", qty: 1, rate: 18750, amount: 18750 },
        { description: "Agent commission (2%)", qty: 1, rate: 2500, amount: 2500 },
      ]),
      notes: "Buyer receipt includes booking deposit and platform fees. GST included where applicable.",
    });
    await createRichInvoice(2, {
      bookingId: "BV-BK-2025",
      bookingName: "Nitin Thapar",
      brokerageName: "Prime Brokers",
      invoiceTo: "Agent",
      subtotal: 428571,
      taxRate: 5,
      taxAmount: 21429,
      totalAmount: 450000,
      commissionPct: 3,
      status: "Generated",
      buyerName: "Nitin Thapar",
      buyerEmail: "nitin.thapar@example.com",
      buyerPhone: "+91 98 7654 3210",
      buyerAddress: "Bandra West, Mumbai, MH 400050",
      agentName: "Priya Kapoor",
      agentEmail: "agent2@plotsnhomes.com",
      agentPhone: "+91 98 1111 2222",
      propertySymbol: "BV-AE-0001",
      propertyTitle: "Palm Jumeirah Villa — Sea View",
      propertyAddress: "Palm Jumeirah, Dubai, UAE",
      lineItemsJson: JSON.stringify([
        { description: "Brokerage commission (3%)", qty: 1, rate: 135000, amount: 135000 },
        { description: "Listing & marketing services", qty: 1, rate: 293571, amount: 293571 },
      ]),
      notes: "Agent settlement invoice — payment due within 30 days of booking confirmation.",
    });
    await createRichInvoice(3, {
      bookingId: "BV-BK-2026",
      bookingName: "Sarah Chen",
      brokerageName: "Elite Homes",
      invoiceTo: "Developer",
      subtotal: 84762,
      taxRate: 5,
      taxAmount: 4238,
      totalAmount: 89000,
      commissionPct: 2.5,
      status: "Pending",
      buyerName: "Sarah Chen",
      buyerEmail: "sarah.chen@example.com",
      buyerPhone: "+1 555 0303",
      buyerAddress: "500 Boylston St, Boston, MA 02116",
      agentName: "Jordan Lee",
      agentEmail: "agent3@plotsnhomes.com",
      agentPhone: "+1 555 0404",
      propertySymbol: "BV-NY-0132",
      propertyTitle: "Hudson Yards Penthouse",
      propertyAddress: "30 Hudson Yards, New York, NY",
      lineItemsJson: JSON.stringify([
        { description: "Developer brokerage share", qty: 1, rate: 75000, amount: 75000 },
        { description: "Platform listing fee", qty: 1, rate: 9762, amount: 9762 },
      ]),
      notes: "Developer invoice for pre-launch allocation.",
    });
    console.log("Seeded sample brokerage invoices with full receipt details.");
  } else {
    const existing = await prisma.brokerageInvoice.findMany();
    let seq = existing.length + 1;
    for (const inv of existing) {
      const needsDetail = !inv.buyerEmail || !inv.invoiceNumber?.startsWith("BV-INV");
      if (!needsDetail) continue;
      await prisma.brokerageInvoice.update({
        where: { id: inv.id },
        data: {
          invoiceNumber:
            !inv.invoiceNumber || !inv.invoiceNumber.startsWith("BV-INV")
              ? `BV-INV-${year}-${String(seq++).padStart(5, "0")}`
              : inv.invoiceNumber,
          subtotal: inv.subtotal || inv.totalAmount * 0.95,
          taxAmount: inv.taxAmount || inv.totalAmount * 0.05,
          taxRate: inv.taxRate || 5,
          commissionPct: inv.commissionPct ?? 2,
          buyerName: inv.buyerName ?? inv.bookingName,
          buyerEmail: `${inv.bookingName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          buyerPhone: "+1 555 0199",
          buyerAddress: "Address on file",
          agentName: inv.agentName ?? "Alex Morgan",
          agentEmail: "agent1@plotsnhomes.com",
          agentPhone: "+1 555 0201",
          propertySymbol: inv.propertySymbol ?? "BV-CA-0022",
          propertyTitle: inv.propertyTitle ?? "PlotsnHomes listing",
          propertyAddress: inv.propertyAddress ?? "See property listing",
          lineItemsJson:
            inv.lineItemsJson ??
            JSON.stringify([
              {
                description: "Brokerage services",
                qty: 1,
                rate: inv.totalAmount,
                amount: inv.totalAmount,
              },
            ]),
          notes: inv.notes ?? "Updated with receipt details for download.",
        },
      });
    }
    console.log("Enriched existing brokerage invoices with receipt fields.");
  }

  const planDefs = [
    {
      slug: "free",
      name: "Free",
      description: "Browse listings and save favorites",
      interval: "LIFETIME" as const,
      price: 0,
      targetRole: "ALL",
      sortOrder: 0,
      features: ["Browse all listings", "Save favorites", "Basic calculators"],
    },
    {
      slug: "investor-monthly",
      name: "Investor Plus",
      description: "Monthly billing for serious investors",
      interval: "MONTHLY" as const,
      price: 29,
      targetRole: "BUYER",
      sortOrder: 10,
      trialDays: 14,
      features: ["Portfolio analytics", "Priority support", "Market alerts"],
    },
    {
      slug: "investor-quarterly",
      name: "Investor Plus (Quarterly)",
      description: "Save vs monthly with quarterly billing",
      interval: "QUARTERLY" as const,
      price: 79,
      targetRole: "BUYER",
      sortOrder: 11,
      features: ["Everything in Investor Plus", "Quarterly market report"],
    },
    {
      slug: "investor-annual",
      name: "Investor Plus (Annual)",
      description: "Best value — billed once per year",
      interval: "YEARLY" as const,
      price: 299,
      targetRole: "BUYER",
      sortOrder: 12,
      features: ["Everything in Investor Plus", "Annual strategy session"],
    },
    {
      slug: "agent-pro-monthly",
      name: "Agent Pro",
      description: "CRM tools and lead management for agents",
      interval: "MONTHLY" as const,
      price: 99,
      targetRole: "AGENT",
      sortOrder: 20,
      features: ["Unlimited listings", "CRM pipeline", "Lead routing"],
    },
    {
      slug: "agent-pro-annual",
      name: "Agent Pro (Annual)",
      description: "Annual plan for professional agents",
      interval: "YEARLY" as const,
      price: 999,
      targetRole: "AGENT",
      sortOrder: 21,
      features: ["Everything in Agent Pro", "Featured agent badge"],
    },
  ];

  for (const p of planDefs) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        interval: p.interval,
        price: p.price,
        targetRole: p.targetRole,
        sortOrder: p.sortOrder,
        trialDays: "trialDays" in p ? p.trialDays : 0,
        featuresJson: JSON.stringify(p.features),
        active: true,
      },
      update: {
        name: p.name,
        description: p.description,
        interval: p.interval,
        price: p.price,
        targetRole: p.targetRole,
        sortOrder: p.sortOrder,
        featuresJson: JSON.stringify(p.features),
        active: true,
      },
    });
  }

  const subCount = await prisma.userSubscription.count();
  if (RESET_DB || subCount === 0) {
    const buyer = await prisma.user.findUnique({ where: { email: "buyer@plotsnhomes.com" } });
    const plansBySlug = Object.fromEntries(
      (await prisma.subscriptionPlan.findMany()).map((pl) => [pl.slug, pl])
    );
    const start = new Date();
    const addMonths = (n: number) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + n);
      return d;
    };
    const addYear = () => {
      const d = new Date(start);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    };

    if (investor && plansBySlug["investor-annual"]) {
      await prisma.userSubscription.create({
        data: {
          userId: investor.id,
          planId: plansBySlug["investor-annual"].id,
          status: "ACTIVE",
          amount: 299,
          currentPeriodStart: start,
          currentPeriodEnd: addYear(),
        },
      });
    }
    if (buyer && plansBySlug["free"]) {
      await prisma.userSubscription.create({
        data: {
          userId: buyer.id,
          planId: plansBySlug["free"].id,
          status: "ACTIVE",
          amount: 0,
          currentPeriodStart: start,
          currentPeriodEnd: null,
        },
      });
    }
    if (agents[0] && plansBySlug["agent-pro-monthly"]) {
      await prisma.userSubscription.create({
        data: {
          userId: agents[0].id,
          planId: plansBySlug["agent-pro-monthly"].id,
          status: "ACTIVE",
          amount: 99,
          currentPeriodStart: start,
          currentPeriodEnd: addMonths(1),
        },
      });
    }
    if (agents[1] && plansBySlug["agent-pro-annual"]) {
      await prisma.userSubscription.create({
        data: {
          userId: agents[1].id,
          planId: plansBySlug["agent-pro-annual"].id,
          status: "TRIALING",
          amount: 999,
          currentPeriodStart: start,
          currentPeriodEnd: addYear(),
          notes: "14-day trial",
        },
      });
    }
  }
  console.log("Subscription plans and sample subscribers ready.");

  const goalCount = await prisma.crmGoal.count();
  if (RESET_DB || goalCount === 0) {
    await prisma.crmGoal.create({
      data: { title: "Monthly site visits", target: 20, current: 5, period: "monthly", ownerId: admin.id },
    });
    await prisma.crmGoal.create({
      data: { title: "Leads qualified", target: 50, current: 12, period: "monthly" },
    });
  }

  const { seedDefaultSettings } = await import("../src/lib/system-settings");
  await seedDefaultSettings();

  const finalPropertyCount = await prisma.property.count();
  console.log("\nSeed complete —", finalPropertyCount, "properties in database");
  console.log("Admin:", admin.email, "/ demo1234");
  console.log("Agents: agent1@plotsnhomes.com … agent10@plotsnhomes.com / demo1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
