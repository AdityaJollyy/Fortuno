"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// The icon swap is CSS-driven off the `.dark` class, so the server and client
// render identical markup — no mounted flag, and nothing to mismatch.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="block dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}
