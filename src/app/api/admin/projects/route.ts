import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { hasAddPermissionServer } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get("developerId");
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const q = searchParams.get("q");

    const where: any = {};
    if (developerId && developerId !== "ALL") {
      where.developerId = developerId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (city && city !== "ALL") {
      where.city = city;
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { city: { contains: q } },
        { reraNumber: { contains: q } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("GET /api/admin/projects Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canAdd = await hasAddPermissionServer(auth.session.user, "/admin/projects");
    if (!canAdd) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to add projects." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      slug,
      developerId,
      projectType,
      projectCategory,
      status,
      reraNumber,
      reraRegDate,
      possessionDate,
      launchDate,
      completionDate,

      // Location
      country,
      state,
      city,
      area,
      locality,
      landmark,
      address,
      zip,
      latitude,
      longitude,
      googleMapsUrl,
      mapEmbed,

      // Description
      shortDescription,
      fullDescription,
      highlightsJson,
      whyInvestJson,
      projectUspJson,
      lifestyleDescription,

      // Media
      coverImage,
      bannerImage,
      galleryImagesJson,
      masterPlanUrl,
      floorPlansJson,
      brochurePdfUrl,
      priceSheetPdfUrl,
      eBrochureUrl,
      walkthroughVideoUrl,
      youtubeUrl,
      virtualTourUrl,
      droneVideoUrl,
      tour360Url,

      // Pricing
      minPrice,
      maxPrice,
      pricePerSqft,
      bookingAmount,
      maintenanceCharges,
      plcCharges,
      gstPct,
      stampDutyPct,
      registrationCharges,
      priceHistoryJson,
      offersJson,

      // Unit Configurations, Towers & Inventory
      configurationsJson,
      towersJson,
      unitsJson,

      // Amenities & Specifications
      amenitiesJson,
      nearbyPlacesJson,
      specificationsJson,
      documentsJson,
      timelineJson,

      // Builder Info
      builderName,
      builderLogo,
      aboutBuilder,
      yearsExperience,
      projectsDelivered,
      ongoingProjectsCount,
      website,

      // Sales & Lead Settings
      salesStatus,
      inventoryPct,
      availableUnitsCount,
      soldUnitsCount,
      reservedUnitsCount,
      launchOffer,
      salesPhone,
      salesEmail,
      salesWhatsapp,
      crmAssignedId,
      leadSettingsJson,

      // Website Controls & SEO
      showOnWebsite,
      featured,
      trending,
      isNewLaunch,
      isHotProperty,
      isSoldOut,
      enableEnquiry,
      enablePriceRequest,
      enableDownloadBrochure,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImageUrl,
      canonicalUrl,
      tagsJson,

      // Financial & Bank Approvals
      financialInfoJson,

      // Settings & Custom Fields
      visibility,
      customFieldsJson,
      analyticsJson,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Project Name is required" },
        { status: 400 }
      );
    }

    const generatedSlug = slug
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        code: code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
        slug: generatedSlug,
        developerId: developerId || null,
        projectType: projectType || "Apartment",
        projectCategory: projectCategory || "Residential",
        status: status || "New Launch",
        reraNumber: reraNumber || null,
        reraRegDate: reraRegDate ? new Date(reraRegDate) : null,
        possessionDate: possessionDate ? new Date(possessionDate) : null,
        launchDate: launchDate ? new Date(launchDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,

        // Location
        country: country || "IN",
        state: state || null,
        city: city || null,
        area: area || null,
        locality: locality || null,
        landmark: landmark || null,
        address: address || null,
        zip: zip || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        googleMapsUrl: googleMapsUrl || null,
        mapEmbed: mapEmbed || null,

        // Description
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        highlightsJson: typeof highlightsJson === "string" ? highlightsJson : JSON.stringify(highlightsJson || []),
        whyInvestJson: typeof whyInvestJson === "string" ? whyInvestJson : JSON.stringify(whyInvestJson || []),
        projectUspJson: typeof projectUspJson === "string" ? projectUspJson : JSON.stringify(projectUspJson || []),
        lifestyleDescription: lifestyleDescription || null,

        // Media
        coverImage: coverImage || null,
        bannerImage: bannerImage || null,
        galleryImagesJson: typeof galleryImagesJson === "string" ? galleryImagesJson : JSON.stringify(galleryImagesJson || []),
        masterPlanUrl: masterPlanUrl || null,
        floorPlansJson: typeof floorPlansJson === "string" ? floorPlansJson : JSON.stringify(floorPlansJson || []),
        brochurePdfUrl: brochurePdfUrl || null,
        priceSheetPdfUrl: priceSheetPdfUrl || null,
        eBrochureUrl: eBrochureUrl || null,
        walkthroughVideoUrl: walkthroughVideoUrl || null,
        youtubeUrl: youtubeUrl || null,
        virtualTourUrl: virtualTourUrl || null,
        droneVideoUrl: droneVideoUrl || null,
        tour360Url: tour360Url || null,

        // Pricing
        minPrice: minPrice ? parseFloat(minPrice) : 0,
        maxPrice: maxPrice ? parseFloat(maxPrice) : 0,
        pricePerSqft: pricePerSqft ? parseFloat(pricePerSqft) : null,
        bookingAmount: bookingAmount ? parseFloat(bookingAmount) : null,
        maintenanceCharges: maintenanceCharges ? parseFloat(maintenanceCharges) : null,
        plcCharges: plcCharges ? parseFloat(plcCharges) : null,
        gstPct: gstPct ? parseFloat(gstPct) : null,
        stampDutyPct: stampDutyPct ? parseFloat(stampDutyPct) : null,
        registrationCharges: registrationCharges ? parseFloat(registrationCharges) : null,
        priceHistoryJson: typeof priceHistoryJson === "string" ? priceHistoryJson : JSON.stringify(priceHistoryJson || []),
        offersJson: typeof offersJson === "string" ? offersJson : JSON.stringify(offersJson || []),

        // Unit Configurations, Towers & Inventory
        configurationsJson: typeof configurationsJson === "string" ? configurationsJson : JSON.stringify(configurationsJson || []),
        towersJson: typeof towersJson === "string" ? towersJson : JSON.stringify(towersJson || []),
        unitsJson: typeof unitsJson === "string" ? unitsJson : JSON.stringify(unitsJson || []),

        // Amenities & Specifications
        amenitiesJson: typeof amenitiesJson === "string" ? amenitiesJson : JSON.stringify(amenitiesJson || {}),
        nearbyPlacesJson: typeof nearbyPlacesJson === "string" ? nearbyPlacesJson : JSON.stringify(nearbyPlacesJson || []),
        specificationsJson: typeof specificationsJson === "string" ? specificationsJson : JSON.stringify(specificationsJson || {}),
        documentsJson: typeof documentsJson === "string" ? documentsJson : JSON.stringify(documentsJson || {}),
        timelineJson: typeof timelineJson === "string" ? timelineJson : JSON.stringify(timelineJson || []),

        // Builder Info
        builderName: builderName || null,
        builderLogo: builderLogo || null,
        aboutBuilder: aboutBuilder || null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        projectsDelivered: projectsDelivered ? parseInt(projectsDelivered) : null,
        ongoingProjectsCount: ongoingProjectsCount ? parseInt(ongoingProjectsCount) : null,
        website: website || null,

        // Sales & Lead Settings
        salesStatus: salesStatus || "Booking Open",
        inventoryPct: inventoryPct ? parseFloat(inventoryPct) : 100,
        availableUnitsCount: availableUnitsCount ? parseInt(availableUnitsCount) : 0,
        soldUnitsCount: soldUnitsCount ? parseInt(soldUnitsCount) : 0,
        reservedUnitsCount: reservedUnitsCount ? parseInt(reservedUnitsCount) : 0,
        launchOffer: launchOffer || null,
        salesPhone: salesPhone || null,
        salesEmail: salesEmail || null,
        salesWhatsapp: salesWhatsapp || null,
        crmAssignedId: crmAssignedId || null,
        leadSettingsJson: typeof leadSettingsJson === "string" ? leadSettingsJson : JSON.stringify(leadSettingsJson || {}),

        // Website Controls & SEO
        showOnWebsite: showOnWebsite ?? true,
        featured: featured ?? false,
        trending: trending ?? false,
        isNewLaunch: isNewLaunch ?? true,
        isHotProperty: isHotProperty ?? false,
        isSoldOut: isSoldOut ?? false,
        enableEnquiry: enableEnquiry ?? true,
        enablePriceRequest: enablePriceRequest ?? true,
        enableDownloadBrochure: enableDownloadBrochure ?? true,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        ogImageUrl: ogImageUrl || null,
        canonicalUrl: canonicalUrl || null,
        tagsJson: typeof tagsJson === "string" ? tagsJson : JSON.stringify(tagsJson || []),

        // Financial & Bank Approvals
        financialInfoJson: typeof financialInfoJson === "string" ? financialInfoJson : JSON.stringify(financialInfoJson || {}),

        // Settings & Custom Fields
        visibility: visibility || "Public",
        customFieldsJson: typeof customFieldsJson === "string" ? customFieldsJson : JSON.stringify(customFieldsJson || []),
        analyticsJson: typeof analyticsJson === "string" ? analyticsJson : JSON.stringify(analyticsJson || {}),
      },
    });

    // Increment developer project count
    if (developerId) {
      const devProjectsCount = await prisma.project.count({
        where: { developerId },
      });
      await prisma.developer.update({
        where: { id: developerId },
        data: { projectCount: devProjectsCount },
      });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("POST /api/admin/projects Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
