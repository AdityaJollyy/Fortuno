"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

// Clerk's ClerkProvider throws on nesting (`multipleClerkProvidersError`), so a
// route-level override is impossible — the appearance has to be set on the one
// provider, and `baseTheme` needs the resolved theme, which is client-only.
// Variables point at the raw shadcn source vars, not the `@theme inline`
// aliases, because only the source vars are guaranteed to be emitted.
const APPEARANCE = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--muted)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    fontFamily: "var(--font-nunito)",
    fontFamilyButtons: "var(--font-manrope)",
    borderRadius: "6px",
  },
  elements: {
    card: "shadow-none border border-border bg-card",
    headerTitle: "hidden", // our auth shell owns the heading
    headerSubtitle: "hidden",
    footer: "hidden", // our auth shell owns the sign-up / sign-in link
    formButtonPrimary: "font-heading font-bold normal-case",
  },
};

export function ClerkThemeProvider({ children }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        ...APPEARANCE,
        // Undefined on the server and on the first client render; dark is the
        // shipped default, so falling to `dark` is what prevents a flash.
        baseTheme: resolvedTheme === "light" ? undefined : dark,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
