import { requireAuth } from "@/lib/auth";
import { ListPropertyForm } from "@/components/dashboard/list-property-form";

export default async function ListPropertyPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">List a property</h1>
      <p className="mt-1 text-slate-600 mb-8">Upload photos, videos &amp; PDFs — admin reviews before publish</p>
      <ListPropertyForm />
    </div>
  );
}
