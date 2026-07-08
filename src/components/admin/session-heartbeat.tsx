"use client";

import { useSession } from "next-auth/react";
import { ActivityHeartbeat } from "@/components/admin/activity-heartbeat";

export function SessionHeartbeat() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <ActivityHeartbeat />;
}
