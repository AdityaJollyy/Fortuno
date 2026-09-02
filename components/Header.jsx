import Link from "next/link";
import { Plus } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

import { AuthSlot } from "@/components/AuthSlot";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavSpinner } from "./NavSpinner";

// Body size, not body-sm, with real padding and a hover surface: at label size
// and zero padding these read as caption text sitting on the wordmark.
const NAV_LINK =
  "text-body font-heading text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 font-semibold transition-colors duration-(--animate-duration-fast) ease-standard outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const Header = async () => {
  // Only the first paint's worth of auth state — AuthSlot takes over from
  // Clerk's client session as soon as it has loaded. The DB user row is no
  // longer created here; requireUser() owns that, so a client-side navigation
  // after sign-up cannot skip it.
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <header className="border-border bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <nav className="max-w-page mx-auto flex h-16 w-full items-center gap-3 px-5 md:h-18 md:px-8">
        <Link
          href="/"
          aria-label="Fortuno home"
          className="focus-visible:ring-ring/50 shrink-0 rounded-xs outline-none focus-visible:ring-3"
        >
          <span className="text-h4 font-heading text-foreground font-extrabold tracking-[-0.045em] lowercase">
            fortuno<span className="text-highlight-ink">.</span>
          </span>
        </Link>

        {/* Inline nav — md and up. Below md it lives in the avatar sheet. The
            hairline plus the ml is what stops it from crowding the wordmark. */}
        <div className="ml-2 hidden items-center gap-1 md:ml-4 md:flex">
          <span
            aria-hidden="true"
            className="bg-border mr-3 hidden h-5 w-px md:block"
          />

          <AuthSlot when="signed-in" serverSignedIn={signedIn}>
            <Link
              href="/dashboard"
              className={`${NAV_LINK} inline-flex items-center gap-1.5`}
            >
              Dashboard
              <NavSpinner />
            </Link>
          </AuthSlot>

          <AuthSlot when="signed-out" serverSignedIn={signedIn}>
            <a href="#features" className={NAV_LINK}>
              What it does
            </a>
            <a href="#how" className={NAV_LINK}>
              How it works
            </a>
            <a href="#faq" className={NAV_LINK}>
              FAQ
            </a>
          </AuthSlot>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <AuthSlot when="signed-in" serverSignedIn={signedIn}>
            {/* Display-only on the dashboard; becomes the date-range trigger on
                account detail, which is a later phase. */}
            <span className="text-label font-heading text-muted-foreground bg-muted border-border hidden rounded-xs border px-2 py-1.5 font-bold tracking-[.13em] uppercase tabular-nums sm:inline-block">
              {format(new Date(), "MMM yyyy")}
            </span>

            {/* nativeButton={false} because the render prop swaps the native
                <button> for an <a> — Base UI warns without it. */}
            <Button
              className="hidden md:inline-flex"
              nativeButton={false}
              render={<Link href="/transaction/create" />}
            >
              <Plus />
              Add transaction
              <NavSpinner />
            </Button>

            <span className="hidden md:inline-flex">
              <ThemeToggle />
            </span>

            <MobileNav />
          </AuthSlot>

          <AuthSlot when="signed-out" serverSignedIn={signedIn}>
            <ThemeToggle />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/sign-in" />}
            >
              Login
              <NavSpinner />
            </Button>
          </AuthSlot>

          <AuthSlot when="signed-in" serverSignedIn={signedIn}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </AuthSlot>
        </div>
      </nav>
    </header>
  );
};

export default Header;
