import { NextResponse } from "next/server";
import { addFormRegistration } from "@/lib/form-registrations-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      companyName,
      businessType,
      operatingRegion,
      customDomain,
      expectedVolume,
      portfolioUnits,
      propertyTypes,
      requestedModules,
      notes,
    } = body;

    if (!name || !email || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Add to Form Registrations Store
    const regRecord = await addFormRegistration({
      type: "WHITE_LABEL_PARTNER",
      name,
      email,
      phone: phone || "",
      companyOrPropertyTitle: companyName,
      categoryOrRole: businessType || "White Label Partner",
      locationOrRegion: operatingRegion || "India",
      detailsJson: JSON.stringify({
        customDomain,
        expectedVolume,
        portfolioUnits,
        propertyTypes,
        requestedModules,
        notes,
      }),
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      message: "White Label Partner application submitted successfully!",
      registrationId: regRecord.id,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit partner application" }, { status: 500 });
  }
}
