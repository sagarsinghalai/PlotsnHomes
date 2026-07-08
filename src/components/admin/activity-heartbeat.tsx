"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/** Keeps lastActiveAt fresh while user browses the site. */
export function ActivityHeartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/user/heartbeat", { method: "POST" })
        .then((res) => {
          if (res.status === 401) {
            signOut({
              redirect: true,
              callbackUrl: "/login?reason=session-expired",
            });
          }
        })
        .catch(() => {});
    };
    ping();
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
