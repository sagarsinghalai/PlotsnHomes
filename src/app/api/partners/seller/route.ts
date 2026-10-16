import { NextResponse } from "next/server";
import { addFormRegistration } from "@/lib/form-registrations-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      sellerType,
      cityState,
      propertyTitle,
      propertyType,
      askingPrice,
      areaSqft,
      bedrooms,
      reraApproved,
      photoDocumentUrl,
      notes,
    } = body;

    if (!name || !email || !propertyTitle) {
      return NextResponse.json({ error: "Missing required seller fields" }, { status: 400 });
    }

    // Add to Form Registrations Store
    const regRecord = await addFormRegistration({
      type: "SELLER",
      name,
      email,
      phone: phone || "",
      companyOrPropertyTitle: propertyTitle,
      categoryOrRole: sellerType || "Individual Seller",
      locationOrRegion: cityState || "India",
      detailsJson: JSON.stringify({
        propertyType,
        askingPrice,
        areaSqft,
        bedrooms,
        reraApproved,
        photoDocumentUrl,
        notes,
      }),
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      message: "Seller property listing application submitted successfully!",
      registrationId: regRecord.id,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit seller application" }, { status: 500 });
  }
}
