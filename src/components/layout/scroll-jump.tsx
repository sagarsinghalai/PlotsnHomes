"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ScrollJump() {
  const pathname = usePathname();
  const [toBottom, setToBottom] = useState(true);

  useEffect(() => {
    function sync() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setToBottom(window.scrollY < Math.max(max / 2, 1));
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [pathname]);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  function jump() {
    window.scrollTo({
      top: toBottom ? document.documentElement.scrollHeight : 0,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      aria-label={toBottom ? "Go to bottom" : "Go to top"}
      onClick={jump}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg transition hover:brightness-110"
    >
      {toBottom ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
    </button>
  );
}
