"use client";

import { useAuth } from "@clerk/nextjs";

// Clerk's <Show> resolves `auth()` during the server render. The header lives in
// the root layout, and Next does not re-render a layout during the client-side
// navigation Clerk performs after sign-in — so a server-resolved header keeps
// whatever auth state it had on the last full page load until you hit refresh.
//
// This reads the client session instead, which flips the instant Clerk's session
// changes. `serverSignedIn` covers the window before Clerk has loaded, so the
// first paint still matches the server and nothing flashes.
export function AuthSlot({ when, serverSignedIn, children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded ? isSignedIn : serverSignedIn;

  return (when === "signed-in") === signedIn ? children : null;
}
