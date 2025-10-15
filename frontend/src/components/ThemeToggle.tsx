"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={toggle} aria-label="Basculer le thème">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Clair" : "Sombre"}
    </Button>
  );
}