"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

/** Mounted once in the root layout. Call toast() from "sonner" anywhere on the client. */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Follow the data-theme attribute that ThemeToggle sets on <html>.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return <Sonner theme={theme} position="bottom-right" richColors closeButton />;
}
