import { SellerFlow } from "@/components/become-seller/seller-flow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Become a Seller — PlotsnHomes",
  description: "Create your seller account and list your property to verified buyers and investors.",
};

export default function BecomeSellerPage() {
  return <SellerFlow />;
}
