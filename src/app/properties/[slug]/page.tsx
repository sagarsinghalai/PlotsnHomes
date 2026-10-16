import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Building2 } from "lucide-react";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyDetailTabs } from "@/components/property/property-detail-tabs";
import { AgentCard } from "@/components/property/agent-card";
import { PaymentOptions } from "@/components/property/payment-options";
import { InquiryForm } from "@/components/property/inquiry-form";
import { PropertyCard } from "@/components/property/property-card";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { stripeConfigured } from "@/lib/stripe";
import { razorpayConfigured } from "@/lib/razorpay";
import { CurrencyConverter } from "@/components/property/currency-converter";
import { PropertyActions } from "@/components/property/property-actions";
import { PropertyPrintBrochure } from "@/components/property/property-print-brochure";
import { formatCurrency, parseImages, parseJsonArray } from "@/lib/utils";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const property = await prisma.property.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      description: true,
      images: true,
    },
  });
  if (!property) return {};

  const images = parseImages(property.images);
  const imageUrl = images[0] || "";

  return {
    title: `${property.title} | PlotsnHomes`,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: property.description.slice(0, 160),
      images: imageUrl ? [imageUrl] : [],
    },
  };
}


function parsePdfs(json: string): { name: string; url: string }[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) =>
      typeof x === "string" ? { name: "Document", url: x } : { name: x.name ?? "Document", url: x.url }
    );
  } catch {
    return [];
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const property = await prisma.property.findUnique({
    where: { slug: params.slug },
    include: {
      agent: true,
      developer: { select: { id: true, name: true, city: true } },
      project: { select: { id: true, name: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }
    },
  });
  if (!property) notFound();

  const developerName = property.developer?.name || (property as any).developerName || "Emaar Properties";

  const session = await getServerSession(authOptions);
  const stripeOn = stripeConfigured();
  const razorpayOn = razorpayConfigured();
  const images = parseImages(property.images);
  const videos = parseJsonArray(property.videos);
  const features = parseJsonArray(property.features);
  const pdfs = parsePdfs(property.pdfs);

  const similar = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      city: property.city,
      id: { not: property.id },
    },
    take: 3,
    include: { agent: { select: { name: true, email: true } } },
  });

  const tabData = {
    ...property,
    features,
    pdfs,
    videos,
    developerName,
    agent: property.agent
      ? {
          name: property.agent.name,
          email: property.agent.email,
          phone: property.agent.phone,
          image: property.agent.image,
        }
      : {
          name: "Listing Representative",
          email: "support@plotsnhomes.com",
          phone: "+91 98765 43210",
          image: null,
        },
    transactions: property.transactions.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/">Home</Link>
          {" / "}
          <Link href="/properties">{property.category ?? property.type}</Link>
          {developerName && (
            <>
              {" / "}
              <span className="text-slate-700 font-semibold">{developerName}</span>
            </>
          )}
          {" / "}
          <span className="text-slate-800 font-bold">{property.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                {property.listingType === "RENT" ? "Rentals" : "Sales"}
              </span>
              {property.category && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{property.category}</span>
              )}
              {developerName && (
                <span className="rounded-md bg-amber-50 border border-amber-300/80 px-2.5 py-0.5 text-xs font-extrabold text-amber-950 inline-flex items-center gap-1 shadow-2xs">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Developer: {developerName}</span>
                </span>
              )}
              {property.featured && (
                <span className="rounded bg-gold px-2 py-0.5 text-xs font-bold">Featured</span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900">{property.title}</h1>
            <p className="mt-1 text-slate-600">
              {property.address}, {property.city}, {property.state}
            </p>
          </div>
          <div className="text-right">
            {property.pricePerSqft && (
              <p className="text-sm text-slate-500">${property.pricePerSqft.toFixed(0)} / sq ft</p>
            )}
            <p className="text-3xl font-bold text-slate-900" suppressHydrationWarning>
              {property.listingType === "RENT"
                ? `${formatCurrency(property.rentMonthly ?? property.price)}/mo`
                : formatCurrency(property.price)}
            </p>
            <div className="mt-3 max-w-xs ml-auto">
              <CurrencyConverter
                amountUsd={
                  property.listingType === "RENT"
                    ? property.rentMonthly ?? property.price
                    : property.price
                }
              />
            </div>
            <PropertyActions
              propertyTitle={property.title}
              propertyPrice={
                property.listingType === "RENT"
                  ? `${formatCurrency(property.rentMonthly ?? property.price)}/mo`
                  : formatCurrency(property.price)
              }
              propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
              propertyDescription={property.description}
              coverImageUrl={images[0] || undefined}
              propertyType={property.type}
              listingStatus={property.status}
              bedsText={property.bedrooms > 0 ? `${property.bedrooms} Bed${property.bedrooms !== 1 ? "s" : ""}` : undefined}
              bathsText={property.bathrooms > 0 ? `${property.bathrooms} Bath${property.bathrooms !== 1 ? "s" : ""}` : undefined}
              areaText={property.sqft != null ? `${property.sqft.toLocaleString()} sq ft` : (property.area ?? undefined)}
            />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <PropertyGallery images={images} title={property.title} />
            <PropertyDetailTabs property={tabData} />

            {similar.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Similar Listings</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {similar.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <AgentCard
              agent={tabData.agent}
              propertyTitle={property.title}
              propertyId={property.symbol}
            />
            {session ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <PaymentOptions
                    propertyId={property.id}
                    propertyPrice={property.price}
                    rentMonthly={property.rentMonthly}
                    propertyType={property.type}
                    brokerageRate={property.brokerageRate ?? 3.0}
                    stripeEnabled={stripeOn || razorpayOn}
                  />
                </div>
                <Link
                  href="/dashboard/loans"
                  className="block text-center rounded-xl border border-gold bg-amber-50 py-3 text-sm font-semibold text-gold-dark hover:bg-amber-100"
                >
                  Apply for a loan on this property
                </Link>
              </>
            ) : (
              <p className="text-sm text-center text-slate-600">
                <Link href="/login" className="text-gold-dark underline">Log in</Link> to invest or apply for a loan
              </p>
            )}
            <InquiryForm
              propertyId={property.id}
              defaultName={session?.user?.name ?? ""}
              defaultEmail={session?.user?.email ?? ""}
            />
          </div>
        </div>
      </div>

      {/* Hidden A4 print brochure — revealed only during window.print() */}
      <PropertyPrintBrochure
        id={property.id}
        title={property.title}
        type={property.type}
        category={property.category}
        listingType={property.listingType}
        status={property.status}
        featured={property.featured}
        address={property.address}
        city={property.city}
        state={property.state}
        price={property.price}
        rentMonthly={property.rentMonthly}
        pricePerSqft={property.pricePerSqft}
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        sqft={property.sqft}
        areaText={property.area}
        garages={property.garages}
        furnishingStatus={property.furnishingStatus}
        yearBuilt={property.yearBuilt}
        description={property.description}
        features={features}
        images={images}
        agent={tabData.agent}
        symbol={property.symbol}
        slug={property.slug}
      />
    </div>
  );
}
