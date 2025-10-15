"use client";

import ClientNav from "@/components/ClientNav";
import ThemeToggle from "@/components/ThemeToggle";
import ClientOnly from "@/components/ClientOnly";
import { useEffect, useState } from "react";

export default function HeaderBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-40 border-b backdrop-blur transition-all duration-300 " +
        (scrolled ? "bg-white/85 dark:bg-neutral-900/80 shadow-sm" : "bg-white/60 dark:bg-neutral-900/60")
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="font-semibold tracking-tight select-none">
          AI CAMP
        </div>
        <div className="flex items-center gap-2">
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
          <ClientOnly>
            <ClientNav />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}