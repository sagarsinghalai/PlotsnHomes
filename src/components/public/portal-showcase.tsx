"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Heart,
  Home,
  X,
  House,
  LandPlot,
  LayoutGrid,
  List,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Store,
  Smile,
  TreePine,
  Users,
  Zap,
} from "lucide-react";

type Intent = "all" | "buy" | "rent" | "plots" | "commercial";

type Listing = {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  oldPrice?: number;
  intent: Exclude<Intent, "all">;
  category: string;
  bhk: string;
  area: number;
  beds: number;
  baths: number;
  facing: string;
  furnishing?: string;
  verified: boolean;
  image: string;
  thumbs: string[];
  pin: { top: string; left: string };
};

type Project = {
  name: string;
  city: string;
  image: string;
  price: string;
  configs: string;
};

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const LISTINGS: Listing[] = [
  {
    id: "golf",
    title: "3 BHK Villa in Golf Greens",
    location: "Greater Noida, UP",
    city: "Greater Noida",
    price: 12500000,
    oldPrice: 14000000,
    intent: "buy",
    category: "Villa",
    bhk: "3 BHK",
    area: 2500,
    beds: 3,
    baths: 3,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1613490493576-7fde63acd811"),
    thumbs: [
      photo("photo-1600585154340-be6161a56a0c"),
      photo("photo-1600210492486-724fe5c67fb0"),
      photo("photo-1600566753086-00f18fb6b3ea"),
      photo("photo-1600607687939-ce8a6c25118c"),
    ],
    pin: { top: "32%", left: "58%" },
  },
  {
    id: "sky",
    title: "2 BHK Apartment in Sky Heights",
    location: "Noida, UP",
    city: "Noida",
    price: 7200000,
    intent: "buy",
    category: "Apartment",
    bhk: "2 BHK",
    area: 1100,
    beds: 2,
    baths: 2,
    facing: "North Facing",
    verified: true,
    image: photo("photo-1545324418-cc1a3fa10c00"),
    thumbs: [
      photo("photo-1545324418-cc1a3fa10c00"),
      photo("photo-1600573472592-401b489a3cdc"),
      photo("photo-1600047509807-ba8f99d2cdbc"),
      photo("photo-1600585154526-990dced4db0d"),
    ],
    pin: { top: "48%", left: "42%" },
  },
  {
    id: "valley",
    title: "Residential Plot in Green Valley",
    location: "Dehradun, UK",
    city: "Dehradun",
    price: 3500000,
    intent: "plots",
    category: "Plot",
    bhk: "Any BHK",
    area: 1800,
    beds: 0,
    baths: 0,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1500382017468-9049fed747ef"),
    thumbs: [
      photo("photo-1500382017468-9049fed747ef"),
      photo("photo-1464146072230-91cabc968266"),
      photo("photo-1500382017468-9049fed747ef"),
      photo("photo-1441974231531-c6227db76b6e"),
    ],
    pin: { top: "62%", left: "70%" },
  },
  {
    id: "river",
    title: "3 BHK Apartment",
    location: "Noida, UP",
    city: "Noida",
    price: 8500000,
    intent: "buy",
    category: "Apartment",
    bhk: "3 BHK",
    area: 1450,
    beds: 3,
    baths: 2,
    facing: "West Facing",
    verified: true,
    image: photo("photo-1486406146926-c627a92ad1ab"),
    thumbs: [
      photo("photo-1486406146926-c627a92ad1ab"),
      photo("photo-1600566753190-17f0baa2a6c3"),
      photo("photo-1600210492493-0946911123ea"),
      photo("photo-1600585154340-be6161a56a0c"),
    ],
    pin: { top: "40%", left: "30%" },
  },
  {
    id: "rent-noida",
    title: "2 BHK for rent near Sector 62",
    location: "Noida, UP",
    city: "Noida",
    price: 28000,
    intent: "rent",
    category: "Apartment",
    bhk: "2 BHK",
    area: 980,
    beds: 2,
    baths: 2,
    facing: "North Facing",
    furnishing: "Fully Furnished",
    verified: true,
    image: photo("photo-1600566753086-00f18fb6b3ea"),
    thumbs: [
      photo("photo-1600566753086-00f18fb6b3ea"),
      photo("photo-1600210492486-724fe5c67fb0"),
      photo("photo-1600573472591-ee6b68d14c68"),
      photo("photo-1600047509358-9dc75507daeb"),
    ],
    pin: { top: "22%", left: "48%" },
  },
  {
    id: "shop",
    title: "Street shop in Sector 18",
    location: "Noida, UP",
    city: "Noida",
    price: 9500000,
    intent: "commercial",
    category: "Shop",
    bhk: "Any BHK",
    area: 420,
    beds: 0,
    baths: 1,
    facing: "South Facing",
    verified: false,
    image: photo("photo-1441986300917-64674bd600d8"),
    thumbs: [
      photo("photo-1441986300917-64674bd600d8"),
      photo("photo-1497366216548-37526070297c"),
      photo("photo-1497366811353-6870744d04b2"),
      photo("photo-1486406146926-c627a92ad1ab"),
    ],
    pin: { top: "54%", left: "24%" },
  },
  {
    id: "rk-civil",
    title: "3 BHK Apartment in Civil Lines",
    location: "Civil Lines, Roorkee",
    city: "Roorkee",
    price: 6800000,
    oldPrice: 7400000,
    intent: "buy",
    category: "Apartment",
    bhk: "3 BHK",
    area: 1420,
    beds: 3,
    baths: 2,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1460317442991-0ec209397118"),
    thumbs: [photo("photo-1600585154340-be6161a56a0c"), photo("photo-1600210492486-724fe5c67fb0"), photo("photo-1600566753086-00f18fb6b3ea"), photo("photo-1600607687939-ce8a6c25118c")],
    pin: { top: "28%", left: "22%" },
  },
  {
    id: "rk-iit",
    title: "2 BHK near IIT Roorkee",
    location: "IIT Road, Roorkee",
    city: "Roorkee",
    price: 5200000,
    intent: "buy",
    category: "Apartment",
    bhk: "2 BHK",
    area: 980,
    beds: 2,
    baths: 2,
    facing: "North Facing",
    verified: true,
    image: photo("photo-1545324418-cc1a3fa10c00"),
    thumbs: [photo("photo-1545324418-cc1a3fa10c00"), photo("photo-1600573472592-401b489a3cdc"), photo("photo-1600047509807-ba8f99d2cdbc"), photo("photo-1600585154526-990dced4db0d")],
    pin: { top: "36%", left: "48%" },
  },
  {
    id: "rk-ramnagar",
    title: "4 BHK Independent House",
    location: "Ramnagar, Roorkee",
    city: "Roorkee",
    price: 11500000,
    intent: "buy",
    category: "Villa",
    bhk: "4 BHK",
    area: 2400,
    beds: 4,
    baths: 4,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1600596542815-ffad4c1539a9"),
    thumbs: [photo("photo-1600596542815-ffad4c1539a9"), photo("photo-1600585154340-be6161a56a0c"), photo("photo-1613490493576-7fde63acd811"), photo("photo-1600210492493-0946911123ea")],
    pin: { top: "22%", left: "68%" },
  },
  {
    id: "rk-solani",
    title: "Residential Plot in Solani Puram",
    location: "Solani Puram, Roorkee",
    city: "Roorkee",
    price: 2800000,
    intent: "plots",
    category: "Plot",
    bhk: "Any BHK",
    area: 1350,
    beds: 0,
    baths: 0,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1500382017468-9049fed747ef"),
    thumbs: [photo("photo-1500382017468-9049fed747ef"), photo("photo-1464146072230-91cabc968266"), photo("photo-1441974231531-c6227db76b6e"), photo("photo-1500382017468-9049fed747ef")],
    pin: { top: "58%", left: "30%" },
  },
  {
    id: "rk-rent",
    title: "2 BHK for rent in Malviya Chowk",
    location: "Malviya Chowk, Roorkee",
    city: "Roorkee",
    price: 18000,
    intent: "rent",
    category: "Apartment",
    bhk: "2 BHK",
    area: 900,
    beds: 2,
    baths: 2,
    facing: "West Facing",
    furnishing: "Semi Furnished",
    verified: true,
    image: photo("photo-1600566753086-00f18fb6b3ea"),
    thumbs: [photo("photo-1600566753086-00f18fb6b3ea"), photo("photo-1600210492486-724fe5c67fb0"), photo("photo-1600573472591-ee6b68d14c68"), photo("photo-1600047509358-9dc75507daeb")],
    pin: { top: "46%", left: "62%" },
  },
  {
    id: "rk-canal",
    title: "3 BHK Villa on Ganga Canal Road",
    location: "Ganga Canal Road, Roorkee",
    city: "Roorkee",
    price: 14500000,
    oldPrice: 15800000,
    intent: "buy",
    category: "Villa",
    bhk: "3 BHK",
    area: 2100,
    beds: 3,
    baths: 3,
    facing: "North Facing",
    verified: true,
    image: photo("photo-1613490493576-7fde63acd811"),
    thumbs: [photo("photo-1613490493576-7fde63acd811"), photo("photo-1600585154340-be6161a56a0c"), photo("photo-1600607687939-ce8a6c25118c"), photo("photo-1600566753190-17f0baa2a6c3")],
    pin: { top: "18%", left: "40%" },
  },
  {
    id: "rk-shop",
    title: "Retail Shop in Civil Lines Market",
    location: "Civil Lines Market, Roorkee",
    city: "Roorkee",
    price: 7500000,
    intent: "commercial",
    category: "Shop",
    bhk: "Any BHK",
    area: 380,
    beds: 0,
    baths: 1,
    facing: "South Facing",
    verified: true,
    image: photo("photo-1441986300917-64674bd600d8"),
    thumbs: [photo("photo-1441986300917-64674bd600d8"), photo("photo-1497366216548-37526070297c"), photo("photo-1497366811353-6870744d04b2"), photo("photo-1486406146926-c627a92ad1ab")],
    pin: { top: "70%", left: "42%" },
  },
  {
    id: "rk-pg",
    title: "Furnished PG near IIT Gate",
    location: "IIT Gate, Roorkee",
    city: "Roorkee",
    price: 9500,
    intent: "rent",
    category: "Apartment",
    bhk: "1 BHK",
    area: 280,
    beds: 1,
    baths: 1,
    facing: "East Facing",
    furnishing: "Fully Furnished",
    verified: true,
    image: photo("photo-1600047509807-ba8f99d2cdbc"),
    thumbs: [photo("photo-1600047509807-ba8f99d2cdbc"), photo("photo-1600566753086-00f18fb6b3ea"), photo("photo-1600210492486-724fe5c67fb0"), photo("photo-1600573472592-401b489a3cdc")],
    pin: { top: "34%", left: "78%" },
  },
  {
    id: "rk-landhaura",
    title: "Corner Plot on Landhaura Road",
    location: "Landhaura Road, Roorkee",
    city: "Roorkee",
    price: 4200000,
    intent: "plots",
    category: "Plot",
    bhk: "Any BHK",
    area: 2200,
    beds: 0,
    baths: 0,
    facing: "North Facing",
    verified: true,
    image: photo("photo-1464146072230-91cabc968266"),
    thumbs: [photo("photo-1464146072230-91cabc968266"), photo("photo-1500382017468-9049fed747ef"), photo("photo-1441974231531-c6227db76b6e"), photo("photo-1500382017468-9049fed747ef")],
    pin: { top: "74%", left: "68%" },
  },
  {
    id: "rk-nh",
    title: "3 BHK on NH-58",
    location: "NH-58, Roorkee",
    city: "Roorkee",
    price: 8200000,
    intent: "buy",
    category: "Apartment",
    bhk: "3 BHK",
    area: 1550,
    beds: 3,
    baths: 2,
    facing: "West Facing",
    verified: true,
    image: photo("photo-1486406146926-c627a92ad1ab"),
    thumbs: [photo("photo-1486406146926-c627a92ad1ab"), photo("photo-1600566753190-17f0baa2a6c3"), photo("photo-1600210492493-0946911123ea"), photo("photo-1600585154340-be6161a56a0c")],
    pin: { top: "52%", left: "16%" },
  },
  {
    id: "rk-salempur",
    title: "Farmhouse in Salempur",
    location: "Salempur, Roorkee",
    city: "Roorkee",
    price: 18500000,
    intent: "buy",
    category: "Villa",
    bhk: "4 BHK",
    area: 3200,
    beds: 4,
    baths: 4,
    facing: "East Facing",
    verified: true,
    image: photo("photo-1600585154340-be6161a56a0c"),
    thumbs: [photo("photo-1600585154340-be6161a56a0c"), photo("photo-1600596542815-ffad4c1539a9"), photo("photo-1600607687939-ce8a6c25118c"), photo("photo-1613490493576-7fde63acd811")],
    pin: { top: "64%", left: "84%" },
  },
  {
    id: "rk-office",
    title: "Office Space on Haridwar Road",
    location: "Haridwar Road, Roorkee",
    city: "Roorkee",
    price: 5500000,
    intent: "commercial",
    category: "Shop",
    bhk: "Any BHK",
    area: 640,
    beds: 0,
    baths: 2,
    facing: "South Facing",
    verified: false,
    image: photo("photo-1497366216548-37526070297c"),
    thumbs: [photo("photo-1497366216548-37526070297c"), photo("photo-1497366811353-6870744d04b2"), photo("photo-1486406146926-c627a92ad1ab"), photo("photo-1441986300917-64674bd600d8")],
    pin: { top: "80%", left: "24%" },
  },
];

const PROJECTS: Project[] = [
  { name: "Godrej Green Estate", city: "Noida", price: "₹72 Lakh onwards", configs: "2 & 3 BHK", image: photo("photo-1460317442991-0ec209397118") },
  { name: "ATS Le Grandiose", city: "Noida", price: "₹1.15 Cr onwards", configs: "3 & 4 BHK", image: photo("photo-1545324418-cc1a3fa10c00") },
  { name: "Tata Housing", city: "Gurgaon", price: "₹95 Lakh onwards", configs: "3 BHK", image: photo("photo-1486406146926-c627a92ad1ab") },
];

const REVIEWS = [
  {
    name: "Rohan Sharma",
    place: "Senior Software Engineer · ₹2.5 Lakh invested",
    quote: "PlotsNHomes made it possible for me to invest in prime spaces with just ₹1 Lakh. The monthly rental payouts arrive without fail.",
    photo: photo("photo-1507003211169-0a1dd7228f2d"),
  },
  {
    name: "Priya Patel",
    place: "Management Consultant · ₹5 Lakh invested",
    quote: "I was skeptical about fractional ownership, but the transparency and KYC process cleared all doubts. I own fractions of two homes.",
    photo: photo("photo-1494790108377-be9c29b29330"),
  },
  {
    name: "Vikram Malhotra",
    place: "Business Owner · ₹12 Lakh invested",
    quote: "Selling shares on the marketplace is incredibly fast. I exited one asset in under 24 hours. The liquidity is a game-changer.",
    photo: photo("photo-1500648767791-00dcc994a43e"),
  },
];

const CITIES = ["Greater Noida", "Noida", "Dehradun", "Gurgaon"];

function matchKnownCity(raw: string) {
  const name = raw.trim();
  const lower = name.toLowerCase();
  if (lower.includes("greater noida")) return "Greater Noida";
  if (lower.includes("gurugram") || lower.includes("gurgaon")) return "Gurgaon";
  if (lower.includes("dehradun") || lower.includes("dehra dun")) return "Dehradun";
  if (lower.includes("noida")) return "Noida";
  return CITIES.find((item) => item.toLowerCase() === lower) ?? name;
}

async function detectVisitorCity() {
  const sources = ["https://get.geojs.io/v1/ip/geo.json", "https://ipwho.is/"];
  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = (await response.json()) as { city?: string; success?: boolean };
      if (data.city && data.success !== false) return matchKnownCity(data.city);
    } catch {
      continue;
    }
  }
  return "";
}
const SEARCH_CATEGORIES = ["Apartment", "Villa", "Penthouse", "Townhouse", "Land/Plot", "Commercial", "Duplex", "Full Floor"];
const BEDROOM_OPTIONS = ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Simplex", "Duplex", "Triplex", "Penthouse"];
const FURNISHING_OPTIONS = ["Fully Furnished", "Semi Furnished", "Unfurnished"];
const AMENITY_OPTIONS: [string, string][] = [
  ["fChairAccessible", "Accessible"],
  ["fElevator", "Elevator"],
  ["fPool", "Pool"],
  ["fVentilation", "Ventilation"],
  ["fWasherDryer", "Laundry"],
  ["fWater", "Water"],
  ["fWifi", "WiFi"],
];
const LISTING_AMENITIES: Record<string, string[]> = {
  "rk-civil": ["fElevator", "fWifi", "fWater", "fVentilation"],
  "rk-iit": ["fWifi", "fWater", "fVentilation"],
  "rk-rent": ["fWifi", "fWasherDryer", "fWater"],
  "rk-pg": ["fWifi", "fWater", "fWasherDryer"],
  "rk-nh": ["fElevator", "fPool", "fWifi", "fWater"],
  "rk-canal": ["fPool", "fWater", "fChairAccessible"],
  "rent-noida": ["fElevator", "fWifi", "fWater"],
};
const LISTING_EXTRAS: Record<string, string[]> = {
  "rk-ramnagar": ["servantRoom", "pujaRoom"],
  "rk-canal": ["pujaRoom", "studyRoom"],
  "rk-salempur": ["servantRoom", "studyRoom"],
  "rk-civil": ["studyRoom"],
  "golf": ["servantRoom", "pujaRoom", "studyRoom"],
};
const BUY_MIN_STANDARD = [
  { value: "0", label: "Min" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "2000000", label: "₹20 Lac" },
  { value: "3000000", label: "₹30 Lac" },
  { value: "4000000", label: "₹40 Lac" },
  { value: "5000000", label: "₹50 Lac" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "20000000", label: "₹2 Cr" },
  { value: "50000000", label: "₹5 Cr" },
  { value: "100000000", label: "₹10 Cr" },
];
const BUY_MAX_STANDARD = [
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "2000000", label: "₹20 Lac" },
  { value: "5000000", label: "₹50 Lac" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "50000000", label: "₹5 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "200000000", label: "₹20 Cr+" },
  { value: "999999999", label: "Max" },
];
const BUY_MIN_LAND = [
  { value: "0", label: "Min" },
  { value: "50000", label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "5000000", label: "₹50 Lac" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "500000000", label: "₹50 Cr" },
];
const BUY_MAX_LAND = [
  { value: "100000", label: "₹1 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "5000000", label: "₹50 Lac" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "500000000", label: "₹50 Cr" },
  { value: "1000000000", label: "₹100 Cr+" },
  { value: "999999999", label: "Max" },
];
const RENT_MIN_STANDARD = [
  { value: "0", label: "Min" },
  { value: "5000", label: "₹5,000" },
  { value: "10000", label: "₹10,000" },
  { value: "20000", label: "₹20,000" },
  { value: "50000", label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "200000", label: "₹2 Lac" },
  { value: "500000", label: "₹5 Lac" },
];
const RENT_MAX_STANDARD = [
  { value: "10000", label: "₹10,000" },
  { value: "20000", label: "₹20,000" },
  { value: "50000", label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "200000", label: "₹2 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac+" },
  { value: "999999999", label: "Max" },
];
const RENT_MAX_LAND = [
  { value: "10000", label: "₹10,000" },
  { value: "50000", label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "100000000", label: "₹10 Cr+" },
  { value: "999999999", label: "Max" },
];

function money(amount: number, intent: Listing["intent"]) {
  if (intent === "rent") return `₹${amount.toLocaleString("en-IN")}`;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  return `₹${Math.round(amount / 100000)} Lakh`;
}

function pinPrice(amount: number, intent: Listing["intent"]) {
  if (intent === "rent") return `₹${Math.round(amount / 1000)}k`;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  return `₹${Math.round(amount / 100000)} L`;
}

function matchesCategory(itemCategory: string, selected: string) {
  if (!selected) return true;
  if (selected === "Land/Plot") return itemCategory === "Plot";
  if (selected === "Commercial") return itemCategory === "Shop";
  if (selected === "Apartment") return itemCategory === "Apartment";
  if (["Villa", "Penthouse", "Townhouse", "Duplex", "Full Floor"].includes(selected)) return itemCategory === "Villa";
  return itemCategory === selected;
}

const searchField =
  "w-full appearance-none rounded-xl border border-[#D5E6F6] bg-white px-3.5 py-2.5 text-sm text-[#16324F] placeholder:text-[#8AA8C4] outline-none transition hover:border-[#93C5FD] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#93C5FD]";

export function PortalShowcase() {
  const [intent, setIntent] = useState<Intent>("all");
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [cityOptions, setCityOptions] = useState(CITIES);
  const [detectedCity, setDetectedCity] = useState("");
  const [locating, setLocating] = useState(true);
  const [category, setCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bhk, setBhk] = useState("");
  const [locality, setLocality] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999999999);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [minBalconies, setMinBalconies] = useState("");
  const [liftType, setLiftType] = useState("");
  const [flatsPerFloor, setFlatsPerFloor] = useState("");
  const [availability, setAvailability] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState(LISTINGS[0].id);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    let active = true;
    detectVisitorCity().then((found) => {
      if (!active) return;
      setLocating(false);
      if (!found) return;
      setDetectedCity(found);
      setCityOptions((current) => (current.some((item) => item.toLowerCase() === found.toLowerCase()) ? current : [found, ...current]));
      setCity((current) => current || found);
    });
    return () => {
      active = false;
    };
  }, []);

  const localities = useMemo(() => {
    const rows = city ? LISTINGS.filter((item) => item.city === city) : LISTINGS;
    return Array.from(new Set(rows.map((item) => item.location.split(",")[0].trim())));
  }, [city]);

  const landLike = category === "Land/Plot" || category === "Commercial";
  const rentalLarge = landLike || category === "Duplex" || category === "Full Floor";
  const minOptions = listingType === "SALE" ? (landLike ? BUY_MIN_LAND : BUY_MIN_STANDARD) : RENT_MIN_STANDARD;
  const maxOptions = listingType === "SALE" ? (landLike ? BUY_MAX_LAND : BUY_MAX_STANDARD) : rentalLarge ? RENT_MAX_LAND : RENT_MAX_STANDARD;

  function chooseListingType(type: "SALE" | "RENT") {
    setListingType(type);
    setIntent(type === "RENT" ? "rent" : "all");
    setPropertyType("");
    setFurnishing("");
    setBhk("");
    setMinPrice(0);
    setMaxPrice(type === "RENT" ? 1000000 : 999999999);
    setCustomMin("");
    setCustomMax("");
  }

  function clearFilters() {
    setListingType("SALE");
    setIntent("all");
    setQuery("");
    setCategory("");
    setPropertyType("");
    setBhk("");
    setLocality("");
    setMinPrice(0);
    setMaxPrice(999999999);
    setCustomMin("");
    setCustomMax("");
    setFurnishing("");
    setMinBaths("");
    setMinSqft("");
    setMinBalconies("");
    setLiftType("");
    setFlatsPerFloor("");
    setAvailability("");
    setAmenities([]);
    setExtras([]);
    setMore(false);
    setCity(detectedCity);
  }

  function toggleAmenity(key: string) {
    setAmenities((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function toggleExtra(key: string) {
    setExtras((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = customMin.trim() ? Number(customMin) : minPrice;
    const max = customMax.trim() ? Number(customMax) : maxPrice;
    const rows = LISTINGS.filter((item) => {
      if (savedOnly && !saved.includes(item.id)) return false;
      if (listingType === "RENT") {
        if (item.intent !== "rent") return false;
      } else if (intent !== "all") {
        if (item.intent !== intent) return false;
      } else if (item.intent === "rent") {
        return false;
      }
      if (city && item.city !== city) return false;
      if (!matchesCategory(item.category, category)) return false;
      if (bhk.endsWith("BHK") && item.bhk !== bhk.replace("BHK", " BHK")) return false;
      if (locality && !item.location.toLowerCase().includes(locality.toLowerCase())) return false;
      if (Number.isFinite(min) && item.price < min) return false;
      if (Number.isFinite(max) && item.price > max) return false;
      if (furnishing && item.furnishing !== furnishing) return false;
      if (minBaths && item.baths < Number(minBaths)) return false;
      if (minSqft && item.area < Number(minSqft)) return false;
      if (availability === "Available" && !item.verified) return false;
      if (availability === "Rented" && item.intent !== "rent") return false;
      if (availability === "Sold") return false;
      if (amenities.length && !amenities.every((key) => (LISTING_AMENITIES[item.id] ?? []).includes(key))) return false;
      if (extras.length && !extras.every((key) => (LISTING_EXTRAS[item.id] ?? []).includes(key))) return false;
      if (!q) return true;
      return `${item.title} ${item.location} ${item.city}`.toLowerCase().includes(q);
    });
    const next = [...rows];
    if (sort === "price_asc") next.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") next.sort((a, b) => b.price - a.price);
    if (sort === "area") next.sort((a, b) => b.area - a.area);
    return next;
  }, [amenities, availability, bhk, category, city, customMax, customMin, extras, furnishing, intent, listingType, locality, maxPrice, minBaths, minPrice, minSqft, query, saved, savedOnly, sort]);

  const visible = filtered;
  const selected = LISTINGS.find((item) => item.id === selectedId) ?? visible[0] ?? LISTINGS[0];

  useEffect(() => {
    if (filtered[0] && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);
  const compared = LISTINGS.filter((item) => compare.includes(item.id));
  const favoriteHomes = LISTINGS.filter((item) => saved.includes(item.id));
  const nearby = city ? LISTINGS.filter((item) => item.city === city) : LISTINGS;

  function pick(id: string) {
    setSelectedId(id);
  }

  function toggleSaved(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleCompare(id: string) {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
    setComparing(false);
  }

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setMenu(null);
  }

  return (
    <div className="min-h-screen bg-white text-[#16324F]" onClick={() => setMenu(null)}>
      <header className="sticky top-0 z-40 border-b border-[#E3EEF8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/portal" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">PlotsNHomes</span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto">
            <MenuButton
              label="Buy"
              open={menu === "buy"}
              onToggle={(event) => {
                event.stopPropagation();
                setMenu(menu === "buy" ? null : "buy");
              }}
            >
              <MenuItem onClick={() => { setIntent("buy"); setCategory(""); jump("section-4"); }}>All homes for sale</MenuItem>
              <MenuItem onClick={() => { setIntent("buy"); setCategory("Villa"); jump("section-4"); }}>Villas</MenuItem>
              <MenuItem onClick={() => { setIntent("buy"); setCategory("Apartment"); jump("section-4"); }}>Apartments</MenuItem>
            </MenuButton>
            <button type="button" onClick={() => { setIntent("rent"); jump("section-4"); }} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#24527A] hover:bg-[#E7F3FC]">
              Rent
            </button>
            <MenuButton
              label="Projects"
              open={menu === "projects"}
              onToggle={(event) => {
                event.stopPropagation();
                setMenu(menu === "projects" ? null : "projects");
              }}
            >
              <MenuItem onClick={() => jump("section-8")}>Featured projects</MenuItem>
              <MenuItem onClick={() => { setIntent("plots"); jump("section-4"); }}>Plots</MenuItem>
            </MenuButton>
            <MenuButton
              label="Services"
              open={menu === "services"}
              onToggle={(event) => {
                event.stopPropagation();
                setMenu(menu === "services" ? null : "services");
              }}
            >
              <MenuItem onClick={() => jump("section-5")}>Map search</MenuItem>
              <MenuItem onClick={() => jump("section-7")}>Save and compare</MenuItem>
            </MenuButton>
            <button type="button" onClick={() => jump("section-9")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#24527A] hover:bg-[#E7F3FC]">
              About
            </button>
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton label="Saved homes" onClick={() => jump("section-7")}>
              <Heart className={`h-4 w-4 ${saved.length ? "fill-[#3B82F6] text-[#3B82F6]" : ""}`} />
            </IconButton>
            <IconButton label="Alerts" onClick={() => setNote(note ? "" : "New listing alerts stay on this page.")}>
              <Bell className="h-4 w-4" />
            </IconButton>
            <Link href="/login" className="rounded-lg bg-[#3B82F6] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2563EB]">
              Login / Sign Up
            </Link>
          </div>
        </div>
        {note && <p className="border-t border-[#E7F3FC] bg-[#F3F8FD] px-4 py-2 text-center text-xs text-[#1D4ED8]">{note}</p>}
      </header>

      <section aria-label="Find a home" className="relative min-h-[440px] overflow-hidden">
        <img
          src={photo("photo-1600585154340-be6161a56a0c")}
          alt="Modern villa at dusk"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2340] via-[#0B2340]/82 to-[#0B2340]/25" />
        <div className="relative mx-auto flex min-h-[440px] w-full max-w-[1440px] items-center px-4 py-16 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
              <span className="tracking-normal text-[#F5C451]">★★★★★</span>
              Rated 4.9 by 1,200+ families
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
              Find Your Dream Home
              <span className="mt-1 block text-[#BFDBFE]">with People You Trust</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85">
              Verified homes, plots and projects — clear titles, real photos, honest pricing. Buy, sell or rent with a team that treats you like family.
            </p>
            <form
              className="mt-6 flex w-full overflow-hidden rounded-xl bg-white shadow-xl"
              onSubmit={(event) => {
                event.preventDefault();
                jump("section-4");
              }}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by city, locality or project..."
                className="h-14 min-w-0 flex-1 px-4 text-sm outline-none"
              />
              <span className="flex h-14 shrink-0 items-center border-l border-[#E3EEF8] bg-white px-4 text-sm font-medium text-[#16324F]">
                {locating ? "Finding city…" : detectedCity || "Your city"}
              </span>
              <button type="submit" className="bg-[#3B82F6] px-6 text-sm font-semibold text-white hover:bg-[#2563EB]">
                Search
              </button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
              {["₹12.4 Cr under management", "2,841 active investors", "48 properties listed"].map((item) => (
                <span key={item} className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="section-types" aria-label="Explore by property type" className="border-b border-[#E7EEF6] bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-5 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex shrink-0 items-center gap-2.5">
            <h2 className="text-lg font-extrabold leading-tight text-[#16324F] sm:text-xl">
              Explore by<br />Property Type
            </h2>
            <button
              type="button"
              aria-label="See all property types"
              onClick={() => jump("section-4")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D7E6F5] bg-[#F4F9FF] text-[#2563EB] hover:bg-[#E7F3FC]"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-1 overflow-x-auto">
            {([
              ["Apartments", Building2, "bg-[#E8F1FF] text-[#2563EB]", "buy", "Apartment"],
              ["Independent Houses", House, "bg-[#E7F0FF] text-[#1D4ED8]", "buy", "Villa"],
              ["Plots", LandPlot, "bg-[#E5F7EE] text-[#059669]", "plots", "Land/Plot"],
              ["Villas", Home, "bg-[#E0F2FE] text-[#0369A1]", "buy", "Villa"],
              ["Commercial", Store, "bg-[#EEF2FF] text-[#4F46E5]", "commercial", "Commercial"],
              ["Farmhouses", TreePine, "bg-[#ECFDF3] text-[#15803D]", "buy", "Villa"],
              ["PG", Users, "bg-[#FEF3C7] text-[#D97706]", "rent", "Apartment"],
              ["Office Space", Briefcase, "bg-[#F3E8FF] text-[#7C3AED]", "commercial", "Commercial"],
            ] as const).map(([label, Icon, tint, nextIntent, nextCategory]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPropertyType(label);
                  setIntent(nextIntent);
                  setListingType(nextIntent === "rent" ? "RENT" : "SALE");
                  setCategory(nextCategory);
                  setMaxPrice(nextIntent === "rent" ? 1000000 : 999999999);
                  jump("section-4");
                }}
                className="flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tint} ${propertyType === label ? "ring-2 ring-[#93C5FD] ring-offset-2" : ""}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-[#1E3A5F] sm:text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
          <div id="section-3" aria-label="Search filters" className="overflow-hidden rounded-2xl border border-[#E3EEF8] bg-white shadow-[0_18px_50px_-24px_rgba(15,60,110,0.45)]">
            <div className="flex items-center justify-between border-b border-[#E3EEF8] bg-[#F3F8FD] p-4 pb-3">
              <div className="flex rounded-xl border border-[#D5E6F6] bg-[#E7F1FB] p-1">
                {([
                  ["SALE", "Buy Properties"],
                  ["RENT", "Rent / Lease"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseListingType(id)}
                    className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition ${
                      listingType === id ? "bg-[#16324F] font-bold text-white shadow-md" : "text-[#5C7A96] hover:bg-white hover:text-[#16324F]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="hidden text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] sm:block">PlotsNHomes Portal</p>
            </div>

            {listingType === "RENT" && (
              <div className="flex flex-wrap items-center gap-2 px-5 pb-0 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">Furnishing:</span>
                {FURNISHING_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFurnishing(furnishing === option ? "" : option)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold transition ${
                      furnishing === option
                        ? "border-[#16324F] bg-[#16324F] text-white"
                        : "border-[#D5E6F6] bg-white text-[#5C7A96] hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                    }`}
                  >
                    {furnishing === option && <X className="h-3 w-3" />}
                    {option}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                jump("section-4");
              }}
              className="p-4 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Bedrooms</label>
                  <div className="relative">
                    <select className={searchField} value={bhk} onChange={(event) => setBhk(event.target.value)}>
                      <option value="">Any Bedrooms</option>
                      {BEDROOM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Search Property</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      list="portal-suggestions"
                      placeholder="Property name, symbol ID (e.g. BV-TN-0012), or city..."
                      className={`${searchField} pl-10`}
                    />
                    <datalist id="portal-suggestions">
                      {LISTINGS.filter((item) => !city || item.city === city).map((item) => (
                        <option key={item.id} value={item.title} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Category</label>
                  <div className="relative">
                    <select className={searchField} value={category} onChange={(event) => setCategory(event.target.value)}>
                      <option value="">All Categories</option>
                      {SEARCH_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">City</label>
                  <div className="relative">
                    <select
                      className={searchField}
                      value={city}
                      onChange={(event) => {
                        setCity(event.target.value);
                        setLocality("");
                      }}
                    >
                      <option value="">{locating && !detectedCity ? "Finding city…" : "All Cities"}</option>
                      {cityOptions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Area / Locality</label>
                  <div className="relative">
                    <select className={searchField} value={locality} onChange={(event) => setLocality(event.target.value)}>
                      <option value="">All Areas</option>
                      {localities.map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Min Price</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <select className={searchField} value={String(minPrice)} onChange={(event) => setMinPrice(Math.min(Number(event.target.value) || 0, maxPrice))}>
                        {minOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                    </div>
                    <input type="number" placeholder="Custom amount" value={customMin} onChange={(event) => setCustomMin(event.target.value)} className="w-full rounded-xl border border-dashed border-[#D5E6F6] bg-[#F7FBFF] px-3 py-1.5 text-xs text-[#16324F] placeholder:text-[#8AA8C4] outline-none focus:border-[#3B82F6]" />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Max Price</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <select className={searchField} value={String(maxPrice)} onChange={(event) => setMaxPrice(Math.max(Number(event.target.value) || 999999999, minPrice))}>
                        {maxOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                    </div>
                    <input type="number" placeholder="Custom amount" value={customMax} onChange={(event) => setCustomMax(event.target.value)} className="w-full rounded-xl border border-dashed border-[#D5E6F6] bg-[#F7FBFF] px-3 py-1.5 text-xs text-[#16324F] placeholder:text-[#8AA8C4] outline-none focus:border-[#3B82F6]" />
                  </div>
                </div>
                <div className="flex flex-col justify-end lg:col-span-3">
                  <label className="mb-1.5 hidden select-none text-[10px] font-bold uppercase tracking-widest text-[#24527A] opacity-0 lg:block">Submit</label>
                  <div className="flex gap-2">
                    <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#2563EB]">
                      <Search className="h-4 w-4 stroke-[2.5px]" /> Search
                    </button>
                    <button type="button" onClick={clearFilters} title="Clear Filters" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D5E6F6] bg-[#F3F8FD] px-3 text-xs font-bold text-[#16324F] transition hover:bg-[#E7F1FB]">
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#E3EEF8] pt-4">
                <button type="button" onClick={() => setMore((open) => !open)} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#24527A] transition hover:text-[#1D4ED8]">
                  <ChevronDown className={`h-4 w-4 transition ${more ? "rotate-180" : ""}`} />
                  {more ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </button>
                {more && (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E3EEF8] bg-[#F3F8FD] p-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Bathrooms</label>
                        <div className="relative">
                          <select className={searchField} value={minBaths} onChange={(event) => setMinBaths(event.target.value)}>
                            <option value="">Any Bathrooms</option>
                            {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+ baths</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Min sq.ft</label>
                        <input type="number" value={minSqft} onChange={(event) => setMinSqft(event.target.value)} placeholder="Any sq.ft" className={searchField} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E3EEF8] bg-[#F3F8FD] p-4">
                      <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Property Extras</label>
                      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#5C7A96]">Balconies</label>
                          <div className="relative">
                            <select className={searchField} value={minBalconies} onChange={(event) => setMinBalconies(event.target.value)}>
                              <option value="">Any</option>
                              {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+ balconies</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#5C7A96]">Lift Type</label>
                          <div className="relative">
                            <select className={searchField} value={liftType} onChange={(event) => setLiftType(event.target.value)}>
                              <option value="">Any</option>
                              {["Common Lift", "Personal Lift", "No Lift"].map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#5C7A96]">Flats/Floor</label>
                          <input type="number" min={1} value={flatsPerFloor} onChange={(event) => setFlatsPerFloor(event.target.value)} placeholder="Any" className={searchField} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#5C7A96]">Availability</label>
                          <div className="relative">
                            <select className={searchField} value={availability} onChange={(event) => setAvailability(event.target.value)}>
                              <option value="">Any</option>
                              {["Available", "Sold", "Rented"].map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-[#E3EEF8] pt-4 sm:grid-cols-3">
                        {([
                          ["servantRoom", "Servant Room"],
                          ["pujaRoom", "Puja Ghar"],
                          ["studyRoom", "Study Room"],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-[#E3EEF8] bg-white px-3.5 py-2.5 text-xs text-[#5C7A96] transition has-[:checked]:border-[#93C5FD] has-[:checked]:bg-[#EFF6FF] has-[:checked]:text-[#1D4ED8]">
                            <input type="checkbox" checked={extras.includes(key)} onChange={() => toggleExtra(key)} className="h-4 w-4 rounded border-[#93C5FD] text-[#3B82F6]" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E3EEF8] bg-[#F3F8FD] p-4">
                      <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#24527A]">Amenities</label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {AMENITY_OPTIONS.map(([key, label]) => (
                          <label key={key} className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-[#E3EEF8] bg-white px-3.5 py-2.5 text-xs text-[#5C7A96] transition has-[:checked]:border-[#93C5FD] has-[:checked]:bg-[#EFF6FF] has-[:checked]:text-[#1D4ED8]">
                            <input type="checkbox" checked={amenities.includes(key)} onChange={() => toggleAmenity(key)} className="h-4 w-4 rounded border-[#93C5FD] text-[#3B82F6]" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div id="section-4" aria-label="Property listings" className="border-t border-[#E3EEF8] bg-[linear-gradient(180deg,#F7FBFF_0%,#FFFFFF_120px)] py-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Featured listings</p>
                <h2 className="mt-1 text-2xl font-extrabold">Handpicked homes for you</h2>
                <p className="mt-1 text-sm text-[#5C7A96]">
                  {filtered.length === 0
                    ? "Every property is verified — clear titles, real photos, honest pricing."
                    : `${filtered.length} verified ${filtered.length === 1 ? "home" : "homes"}${city ? ` in ${city}` : ""} · clear titles, real photos, honest pricing`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-[#5C7A96]">
                  Sort by:
                  <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-[#D5E6F6] bg-white px-2 py-1.5 text-xs text-[#16324F]">
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="area">Largest area</option>
                  </select>
                </label>
                <button type="button" aria-label="Grid view" onClick={() => setLayout("grid")} className={`rounded-lg p-2 ${layout === "grid" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "text-[#7BA0C4]"}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button type="button" aria-label="List view" onClick={() => setLayout("list")} className={`rounded-lg p-2 ${layout === "list" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "text-[#7BA0C4]"}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
            {visible.length === 0 ? (
              <p className="rounded-2xl bg-[#F3F8FD] px-4 py-12 text-center text-sm text-[#5C7A96]">
                {city ? `No homes listed in ${city} yet.` : "No properties match these filters."}
              </p>
            ) : (
              <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
                {visible.map((item) => {
                  const tag = item.intent === "rent" ? "For Rent" : item.intent === "plots" ? "Plot" : item.intent === "commercial" ? "Commercial" : "For Sale";
                  return (
                    <article
                      key={item.id}
                      onClick={() => pick(item.id)}
                      className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-[0_16px_40px_-28px_rgba(15,60,110,0.7)] transition hover:-translate-y-1 hover:shadow-[0_22px_40px_-24px_rgba(37,99,235,0.45)] ${selected.id === item.id ? "border-[#3B82F6] ring-2 ring-[#BFDBFE]" : "border-[#E3EEF8]"} ${layout === "list" ? "flex" : ""}`}
                    >
                      <div className={`relative overflow-hidden ${layout === "list" ? "h-40 w-56 shrink-0" : "h-52"}`}>
                        <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B1F3A]/55 to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">{tag}</span>
                        {item.verified && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#16A34A] px-2 py-0.5 text-[10px] font-bold text-white">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={saved.includes(item.id) ? "Remove saved home" : "Save home"}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSaved(item.id);
                          }}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#3B82F6] shadow-sm"
                        >
                          <Heart className={`h-4 w-4 ${saved.includes(item.id) ? "fill-[#3B82F6]" : ""}`} />
                        </button>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3B82F6]">{item.category} · {item.bhk === "Any BHK" ? "Open plan" : item.bhk}</p>
                        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug">{item.title}</h3>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-[#5C7A96]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" /> {item.location}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-[#24527A]">
                          {item.beds > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F8FD] px-2 py-1"><BedDouble className="h-3.5 w-3.5 text-[#3B82F6]" /> {item.beds} Beds</span>}
                          {item.baths > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F8FD] px-2 py-1"><Bath className="h-3.5 w-3.5 text-[#3B82F6]" /> {item.baths} Baths</span>}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F8FD] px-2 py-1"><LayoutGrid className="h-3.5 w-3.5 text-[#3B82F6]" /> {item.area.toLocaleString("en-IN")} sq.ft.</span>
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#E3EEF8] pt-3">
                          <p className="text-lg font-extrabold text-[#16324F]">
                            {money(item.price, item.intent)}
                            {item.intent === "rent" && <span className="text-xs font-medium text-[#5C7A96]"> /mo</span>}
                            {item.oldPrice && (
                              <span className="ml-1.5 text-xs font-medium text-[#94A3B8] line-through">{money(item.oldPrice, item.intent)}</span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleCompare(item.id);
                            }}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${compare.includes(item.id) ? "bg-[#3B82F6] text-white" : "bg-[#E7F3FC] text-[#1D4ED8]"}`}
                          >
                            {compare.includes(item.id) ? "Added" : "Compare"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="section-5" aria-label="Map" className="border-t border-[#E3EEF8] bg-[#EAF3FB]">
        <div className="mx-auto grid w-full max-w-[1440px] items-stretch gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-10">
          <div className="relative min-h-[460px] overflow-hidden rounded-[28px] bg-[#C5D8EA] shadow-[0_20px_50px_-32px_rgba(15,60,110,0.7)]">
            <img
              src={photo("photo-1465447142348-e9952c393450")}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(236,246,255,0.35),rgba(255,255,255,0.05)_38%,rgba(12,32,58,0.22))]" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#16324F] shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-[#3B82F6]" />
              {city || selected.city}
              <span className="text-[#7BA0C4]">·</span>
              {nearby.length} homes
            </div>
            {nearby.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-md transition hover:z-10 hover:scale-105 ${selected.id === item.id ? "z-10 bg-[#1D4ED8] text-white ring-4 ring-[#BFDBFE]" : "bg-white text-[#1D4ED8]"}`}
                style={{ top: item.pin.top, left: item.pin.left }}
                aria-label={item.title}
              >
                {pinPrice(item.price, item.intent)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => jump("section-4")}
              className="absolute bottom-4 left-4 right-4 flex max-w-md items-center gap-3 rounded-2xl bg-white p-2 text-left shadow-[0_16px_40px_-18px_rgba(15,60,110,0.55)] sm:right-auto"
            >
              <img src={selected.image} alt="" className="h-[72px] w-[92px] shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 py-1 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#3B82F6]">{selected.location}</span>
                <span className="mt-0.5 block truncate text-sm font-semibold">{selected.title}</span>
                <span className="mt-1 block text-sm font-extrabold text-[#1D4ED8]">
                  {money(selected.price, selected.intent)}
                  {selected.intent === "rent" ? " /mo" : ""}
                </span>
              </span>
            </button>
          </div>
          <div className="flex flex-col rounded-[28px] bg-white p-5 shadow-[0_16px_40px_-28px_rgba(15,60,110,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Near you</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight">Explore properties in {city || selected.city}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C7A96]">
              {city === "Roorkee"
                ? "Verified homes, plots and shops around Civil Lines, IIT Road and the Ganga Canal. Clear titles and exact locations — tap a price to preview one."
                : `Verified homes across ${city || selected.city}, with clear titles and exact locations. Tap a price to preview one.`}
            </p>
            <ul className="mt-4 space-y-2">
              {nearby.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition hover:border-[#93C5FD] ${selected.id === item.id ? "border-[#3B82F6] bg-[#F3F8FD]" : "border-[#E3EEF8] bg-white"}`}
                  >
                    <img src={item.image} alt="" className="h-14 w-16 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#5C7A96]">{item.location}</span>
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-[#1D4ED8]">{pinPrice(item.price, item.intent)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => jump("section-4")} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2563EB]">
              View all {nearby.length} homes <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="section-7" aria-label="Saved and compare" className="border-t border-[#D5E6F6] bg-[#EAF3FB]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Shortlist</p>
              <h2 className="mt-1 text-2xl font-extrabold">Save and compare homes</h2>
            </div>
            <p className="text-sm text-[#5C7A96]">{favoriteHomes.length} saved · {compared.length} of 3 in compare</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_-28px_rgba(15,60,110,0.55)]">
              <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
                <div className="grid grid-cols-2 gap-1.5 bg-[#F3F8FD] p-3">
                  {(favoriteHomes.length ? favoriteHomes : nearby).slice(0, 3).map((item, index, preview) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.title}
                      onClick={() => { pick(item.id); jump("section-4"); }}
                      className={`overflow-hidden rounded-2xl ${preview.length === 3 && index > 0 ? "h-20" : "col-span-2 h-28"}`}
                    >
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="flex flex-col p-5 sm:p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7F3FC] text-[#3B82F6]"><Heart className={`h-5 w-5 ${favoriteHomes.length ? "fill-[#3B82F6]" : ""}`} /></span>
                  <h3 className="mt-4 text-xl font-bold">Save your favorites</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5C7A96]">Keep a shortlist of the homes you love and come back when you are ready.</p>
                  <ul className="mt-4 space-y-2">
                    {(favoriteHomes.length ? favoriteHomes : []).slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="shrink-0 text-xs font-bold text-[#1D4ED8]">{pinPrice(item.price, item.intent)}</span>
                      </li>
                    ))}
                    {favoriteHomes.length === 0 && (
                      <li className="rounded-xl bg-[#F3F8FD] px-3 py-2 text-sm text-[#5C7A96]">No saved homes yet. Use the heart on any card.</li>
                    )}
                  </ul>
                  <button type="button" onClick={() => { setSavedOnly((value) => !value); jump("section-4"); }} className="mt-auto pt-5">
                    <span className="inline-flex rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2563EB]">
                      {savedOnly ? "Show all homes" : favoriteHomes.length ? `View ${favoriteHomes.length} saved` : "Browse homes"}
                    </span>
                  </button>
                </div>
              </div>
            </article>
            <article className="flex flex-col rounded-[28px] bg-white p-5 shadow-[0_16px_40px_-28px_rgba(15,60,110,0.55)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7F3FC] text-[#3B82F6]"><Scale className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-xl font-bold">Compare properties</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5C7A96]">Compare up to 3 homes on price, size and facing before you decide.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slot) => {
                  const item = compared[slot];
                  if (!item) {
                    return (
                      <button key={slot} type="button" onClick={() => jump("section-4")} className="flex h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F7FBFF] text-center text-[11px] font-semibold text-[#3B82F6]">
                        Add home
                      </button>
                    );
                  }
                  return (
                    <button key={item.id} type="button" aria-label={item.title} onClick={() => pick(item.id)} className="overflow-hidden rounded-2xl border border-[#E3EEF8] text-left">
                      <img src={item.image} alt="" className="h-16 w-full object-cover" />
                      <span className="block truncate px-2 py-1.5 text-[11px] font-semibold">{item.title}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setComparing(true)}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2563EB]"
              >
                {compared.length < 2 ? "Pick homes to compare" : "Show comparison"} <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          </div>
          {comparing && (
            <div className="mt-4 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_-28px_rgba(15,60,110,0.45)] sm:p-5">
              {compared.length < 2 ? (
                <p className="px-1 py-2 text-sm text-[#5C7A96]">Choose at least two homes with Compare on the cards. You can keep three.</p>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(0, 1fr))` }}>
                  {compared.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-[#E3EEF8]">
                      <img src={item.image} alt="" className="h-32 w-full object-cover" />
                      <div className="space-y-2 p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
                        <p className="text-lg font-extrabold text-[#1D4ED8]">{money(item.price, item.intent)}</p>
                        <dl className="grid grid-cols-2 gap-2 text-xs text-[#24527A]">
                          <div className="rounded-lg bg-[#F3F8FD] px-2 py-1.5"><dt className="text-[#7BA0C4]">City</dt><dd className="font-semibold">{item.city}</dd></div>
                          <div className="rounded-lg bg-[#F3F8FD] px-2 py-1.5"><dt className="text-[#7BA0C4]">BHK</dt><dd className="font-semibold">{item.bhk}</dd></div>
                          <div className="rounded-lg bg-[#F3F8FD] px-2 py-1.5"><dt className="text-[#7BA0C4]">Area</dt><dd className="font-semibold">{item.area.toLocaleString("en-IN")} sq.ft.</dd></div>
                          <div className="rounded-lg bg-[#F3F8FD] px-2 py-1.5"><dt className="text-[#7BA0C4]">Facing</dt><dd className="font-semibold">{item.facing.replace(" Facing", "")}</dd></div>
                        </dl>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="section-8" aria-label="Featured projects" className="border-t border-[#E3EEF8] bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Featured listings</p>
              <h2 className="mt-1 text-2xl font-extrabold">Handpicked projects</h2>
              <p className="mt-1 text-sm text-[#5C7A96]">Developer launches with clear titles, real photos and honest starting prices. Own a share from ₹40,000.</p>
            </div>
            <button type="button" onClick={() => jump("section-4")} className="shrink-0 text-sm font-semibold text-[#3B82F6]">View All Projects</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PROJECTS.map((project) => (
              <article key={project.name} className="group overflow-hidden rounded-2xl border border-[#E3EEF8] bg-white shadow-[0_12px_32px_-22px_rgba(15,60,110,0.55)] transition hover:-translate-y-0.5">
                <div className="relative h-48 overflow-hidden">
                  <img src={project.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B1F3A]/50 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">Featured</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold">{project.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-[#5C7A96]"><MapPin className="h-3.5 w-3.5 text-[#3B82F6]" /> {project.city}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E3EEF8] pt-3">
                    <span className="text-sm font-extrabold text-[#1D4ED8]">{project.price}</span>
                    <span className="rounded-full bg-[#F3F8FD] px-2.5 py-1 text-[11px] font-semibold text-[#24527A]">{project.configs}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="section-9" aria-label="Why PlotsNHomes" className="bg-[#F7FBFF]">
        <div className="mx-auto grid w-full max-w-[1440px] items-stretch gap-5 px-4 py-8 sm:px-6 md:grid-cols-[1.25fr_0.95fr] lg:px-10">
          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] bg-[#14325C] text-white">
            <img
              src={photo("photo-1600596542815-ffad4c1539a9")}
              alt="A modern home at dusk"
              className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#102A52] via-[#14325C]/90 to-[#14325C]/10" />
            <div className="relative flex h-full min-h-[300px] flex-col justify-between px-6 py-7 sm:px-8">
              <div>
                <h2 className="text-[28px] font-extrabold leading-tight">Why Choose PlotsNHomes?</h2>
                <p className="mt-1 max-w-sm text-sm text-white/80">Verified homes, plots and projects. A team that treats you like family.</p>
              </div>
              <div>
                <div className="grid max-w-md grid-cols-4 gap-2">
                  {[
                    [ShieldCheck, "Verified Titles", "text-white"],
                    [Handshake, "Expert Advisors", "text-white"],
                    [Zap, "From ₹40,000", "text-white"],
                    [Smile, "Honest Pricing", "text-[#F5C451]"],
                  ].map(([Icon, title, tone]) => (
                    <div key={title as string} className="text-center">
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                        <Icon className={`h-5 w-5 ${tone as string}`} />
                      </span>
                      <p className="mt-2 text-[11px] font-semibold leading-tight sm:text-xs">{title as string}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => jump("section-4")}
                  className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#E7F3FC]"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-[#16324F]">What our customers say</h2>
                <p className="mt-1 text-sm text-[#5C7A96]">Real stories from families who found a home with us.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviews((open) => !open)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#BFDBFE] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#F3F8FD]"
              >
                View All Reviews <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <button
                type="button"
                aria-label="Previous review"
                onClick={() => setReviewIndex((index) => (index + REVIEWS.length - 1) % REVIEWS.length)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E3EEF8] bg-white text-[#5C7A96] shadow-sm hover:text-[#1D4ED8]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <article className="min-w-0 flex-1 rounded-2xl border border-[#E6EEF6] bg-white px-5 py-5 shadow-[0_16px_40px_-24px_rgba(15,60,110,0.5)]">
                <div className="flex items-start gap-3">
                  <img src={REVIEWS[reviewIndex].photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#E7F3FC]" />
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-[#24527A]">“{REVIEWS[reviewIndex].quote}”</p>
                    <p className="mt-3 text-sm font-bold text-[#16324F]">{REVIEWS[reviewIndex].name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-[#5C7A96]">{REVIEWS[reviewIndex].place}</p>
                      <span className="flex text-[#F5B942]">
                        {Array.from({ length: 5 }).map((_, star) => (
                          <Star key={star} className="h-3.5 w-3.5 fill-[#F5B942]" />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              <button
                type="button"
                aria-label="Next review"
                onClick={() => setReviewIndex((index) => (index + 1) % REVIEWS.length)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E3EEF8] bg-white text-[#5C7A96] shadow-sm hover:text-[#1D4ED8]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex justify-center gap-1.5">
              {REVIEWS.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={`Show review from ${item.name}`}
                  onClick={() => setReviewIndex(index)}
                  className={`h-1.5 rounded-full ${index === reviewIndex ? "w-5 bg-[#3B82F6]" : "w-1.5 bg-[#D5E2EF]"}`}
                />
              ))}
            </div>
            {showReviews && (
              <ul className="mt-3 space-y-2">
                {REVIEWS.map((item) => (
                  <li key={item.name} className="rounded-xl bg-white px-3 py-2 text-xs text-[#24527A]">
                    <span className="font-semibold text-[#16324F]">{item.name}.</span> {item.quote}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Footer variant="portal" />
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-full text-[#24527A] hover:bg-[#E7F3FC]">
      {children}
    </button>
  );
}

function MenuButton({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: (event: React.MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className="inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#24527A] hover:bg-[#E7F3FC]">
        {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#E3EEF8] bg-white p-1 shadow-lg" onClick={(event) => event.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#16324F] hover:bg-[#E7F3FC]">
      {children}
    </button>
  );
}
