"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

export function NavSpinner() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return <Loader2 className="size-4 animate-spin" aria-hidden="true" />;
}
