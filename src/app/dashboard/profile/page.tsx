import { ProfileForm } from "@/components/dashboard/profile-form";
import { AccountSecurity } from "@/components/dashboard/account-security";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      country: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    return <p className="p-8 text-slate-600">Account not found.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">Profile &amp; account settings</h1>
      <p className="mt-2 text-slate-600">
        Manage your personal details, photo, password and account. KYC documents are managed separately.
      </p>
      <div className="mt-8">
        <ProfileForm user={user} />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold text-slate-900">Security &amp; account</h2>
        <div className="mt-4">
          <AccountSecurity />
        </div>
      </div>
    </div>
  );
}
