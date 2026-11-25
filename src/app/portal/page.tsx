import type { Metadata } from "next";
import { PortalShowcase } from "@/components/public/portal-showcase";

export const metadata: Metadata = {
  title: "PlotsNHomes portal",
  description: "Search plots and homes, filter like a property directory, and open a listing, map, or project.",
};

export default function PortalPage() {
  return <PortalShowcase />;
}
