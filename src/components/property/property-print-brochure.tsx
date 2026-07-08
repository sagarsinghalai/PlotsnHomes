"use client";

import React, { useState, useEffect } from "react";

interface AgentInfo {
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
}

interface PropertyPrintBrochureProps {
  id: string;
  title: string;
  type: string;
  category?: string | null;
  listingType: string;
  status: string;
  featured: boolean;
  address: string;
  city: string;
  state: string;
  price: number;
  rentMonthly?: number | null;
  pricePerSqft?: number | null;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number | null;
  areaText?: string | null;
  garages?: number;
  furnishingStatus?: string | null;
  yearBuilt?: number | null;
  description: string;
  features: string[];
  images: string[];
  agent: AgentInfo;
  symbol?: string;
  slug?: string;
}

function formatCurrencyBrochure(amount: number): string {
  if (!amount) return "—";
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

export function PropertyPrintBrochure(props: PropertyPrintBrochureProps) {
  const {
    title,
    type,
    category,
    listingType,
    status,
    featured,
    address,
    city,
    state,
    price,
    rentMonthly,
    pricePerSqft,
    bedrooms,
    bathrooms,
    sqft,
    areaText,
    garages,
    furnishingStatus,
    yearBuilt,
    description,
    features,
    images,
    agent,
    symbol,
    slug,
  } = props;

  const mainImage = images[0] || null;
  const displayPrice = listingType === "RENT"
    ? `${formatCurrencyBrochure(rentMonthly ?? price)} / mo`
    : formatCurrencyBrochure(price);

  const pageUrl = typeof window !== "undefined"
    ? window.location.href
    : slug ? `/properties/${slug}` : "";

  // Derive display area
  const displayArea = sqft != null && sqft > 0
    ? `${sqft.toLocaleString()} sq ft`
    : areaText ?? null;

  const [printDate, setPrintDate] = useState("");
  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  return (
    <div id="property-print-brochure" aria-hidden="true">
      {/* ── Header ── */}
      <div className="print-header">
        <div className="print-logo">
          <span className="print-logo-icon">BV</span>
          <span className="print-logo-name">PlotsnHomes</span>
        </div>
        <div className="print-header-right">
          <p className="print-header-title">Property Details</p>
          {printDate && <p className="print-header-date">Printed on {printDate}</p>}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="print-hero">
        {mainImage && (
          <div className="print-hero-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImage} alt={title} className="print-hero-image" />
          </div>
        )}
        <div className="print-hero-info">
          <div className="print-badges">
            <span className="print-badge print-badge-type">
              {listingType === "RENT" ? "For Rent" : "For Sale"}
            </span>
            {category && <span className="print-badge print-badge-cat">{category}</span>}
            {featured && <span className="print-badge print-badge-featured">★ Featured</span>}
            <span className="print-badge print-badge-status">{status}</span>
          </div>
          <h1 className="print-property-title">{title}</h1>
          <p className="print-property-address">📍 {address}, {city}, {state}</p>
        </div>
      </div>

      {/* ── Price ── */}
      <div className="print-section print-price-section">
        <h2 className="print-section-title">Price</h2>
        <div className="print-price-row">
          <span className="print-price-main">{displayPrice}</span>
          {pricePerSqft && (
            <span className="print-price-sqft">
              {formatCurrencyBrochure(pricePerSqft)} / sq ft
            </span>
          )}
        </div>
      </div>

      {/* ── Key Details ── */}
      <div className="print-section">
        <h2 className="print-section-title">Key Details</h2>
        <div className="print-details-grid">
          {bedrooms != null && bedrooms > 0 && (
            <div className="print-detail-item">
              <span className="print-detail-label">Bedrooms</span>
              <span className="print-detail-value">{bedrooms}</span>
            </div>
          )}
          {bathrooms != null && bathrooms > 0 && (
            <div className="print-detail-item">
              <span className="print-detail-label">Bathrooms</span>
              <span className="print-detail-value">{bathrooms}</span>
            </div>
          )}
          {displayArea && (
            <div className="print-detail-item">
              <span className="print-detail-label">Area</span>
              <span className="print-detail-value">{displayArea}</span>
            </div>
          )}
          <div className="print-detail-item">
            <span className="print-detail-label">Type</span>
            <span className="print-detail-value">{type}</span>
          </div>
          {garages != null && garages > 0 && (
            <div className="print-detail-item">
              <span className="print-detail-label">Garages</span>
              <span className="print-detail-value">{garages}</span>
            </div>
          )}
          {furnishingStatus && (
            <div className="print-detail-item">
              <span className="print-detail-label">Furnishing</span>
              <span className="print-detail-value">{furnishingStatus}</span>
            </div>
          )}
          {yearBuilt != null && (
            <div className="print-detail-item">
              <span className="print-detail-label">Year Built</span>
              <span className="print-detail-value">{yearBuilt}</span>
            </div>
          )}
          <div className="print-detail-item">
            <span className="print-detail-label">Status</span>
            <span className="print-detail-value">{status}</span>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {description && (
        <div className="print-section">
          <h2 className="print-section-title">Description</h2>
          <p className="print-description">{description}</p>
        </div>
      )}

      {/* ── Features / Amenities ── */}
      {features.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Amenities &amp; Features</h2>
          <ul className="print-features-grid">
            {features.map((f, i) => (
              <li key={i} className="print-feature-item">✓ {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Agent Contact ── */}
      <div className="print-section print-agent-section">
        <h2 className="print-section-title">Agent Contact</h2>
        <div className="print-agent-info">
          {agent.name && <p className="print-agent-name">{agent.name}</p>}
          {agent.phone && <p className="print-agent-contact">📞 {agent.phone}</p>}
          {agent.email && <p className="print-agent-contact">✉ {agent.email}</p>}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="print-footer">
        <div>
          <strong>PlotsnHomes</strong> — Premium Real Estate Investment
          {symbol && <span className="print-ref"> · Ref: {symbol}</span>}
        </div>
        {pageUrl && (
          <div className="print-footer-url">
            {pageUrl}
          </div>
        )}
        <div className="print-footer-tag">Generated from PlotsnHomes</div>
      </div>
    </div>
  );
}
