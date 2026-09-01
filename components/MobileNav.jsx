"use client";

import Link from "next/link";
import { LayoutDashboard, Menu, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The sheet the avatar row opens below `md`: everything the inline nav shows at
// `md` and up, plus the theme switch. Labels and icons swap off the `.dark`
// class rather than off `resolvedTheme`, so the server and client render the
// same markup and there is no mounted flag — same trick as ThemeToggle.
const ITEM = "text-body-sm font-heading h-11 gap-2.5 px-2.5 font-semibold";

export function MobileNav() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="md:hidden"
          />
        }
      >
        <Menu />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuItem className={ITEM} render={<Link href="/dashboard" />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuItem
          className={ITEM}
          render={<Link href="/transaction/create" />}
        >
          <Plus />
          Add transaction
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className={ITEM}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Moon className="block dark:hidden" />
          <Sun className="hidden dark:block" />
          <span className="block dark:hidden">Dark mode</span>
          <span className="hidden dark:block">Light mode</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
