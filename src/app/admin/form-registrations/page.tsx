import { getFormRegistrations } from "@/lib/form-registrations-store";
import { FormRegistrationsClient } from "@/components/admin/form-registrations-client";

export const metadata = {
  title: "Form Registrations | Admin Panel",
};

export default async function FormRegistrationsPage() {
  const registrations = await getFormRegistrations();

  return <FormRegistrationsClient initialRegistrations={registrations} />;
}
