import { ProfileForm } from "@/components/dashboard/profile-form";
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
      <h1 className="font-display text-3xl font-bold text-slate-900">Edit profile</h1>
      <p className="mt-2 text-slate-600">
        Update your contact details and address. KYC documents are managed separately.
      </p>
      <div className="mt-8">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
