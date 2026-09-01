"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { Loader2Icon } from "lucide-react";

// A 6px status dot instead of an icon. The dot is decoration — every toast
// carries its message as text, so colour is never the only signal.
const Dot = ({ className }) => (
  <span className={`size-1.5 shrink-0 rounded-full ${className}`} />
);

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <Dot className="bg-positive" />,
        info: <Dot className="bg-primary" />,
        warning: <Dot className="bg-highlight" />,
        error: <Dot className="bg-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--muted)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--input)",
        "--border-radius": "var(--radius-md)",
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
