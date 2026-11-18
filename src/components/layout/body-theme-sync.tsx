"use client";

import { useEffect } from "react";

export function BodyThemeSync({ theme }: { theme: "light" | "dark" }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === "dark") {
      root.style.backgroundColor = "#020617";
      body.style.backgroundColor = "#020617";
    } else {
      root.style.backgroundColor = "#ffffff";
      body.style.backgroundColor = "#ffffff";
    }

    return () => {
      root.style.backgroundColor = "";
      body.style.backgroundColor = "";
    };
  }, [theme]);

  return null;
}
