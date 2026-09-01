"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format, getDate } from "date-fns";

// The shell owns the wordmark, the heading, the sub-line and the switch link.
// Clerk's own card chrome is hidden through `elements` in ClerkThemeProvider,
// so <SignIn /> and <SignUp /> render only the fields and buttons.
function copyFor(isSignUp) {
  if (isSignUp) {
    return {
      title: "Start your ledger.",
      subline:
        "Add an account, set a budget, and Fortuno keeps the running total.",
      prompt: "Already have an account?",
      linkLabel: "Sign in",
      href: "/sign-in",
    };
  }

  const now = new Date();
  const day = getDate(now);

  return {
    title: "Welcome back.",
    subline: `${format(now, "MMMM")} is ${day} ${day === 1 ? "day" : "days"} in. Let’s see where you are.`,
    prompt: "New here?",
    linkLabel: "Create an account",
    href: "/sign-up",
  };
}

const AuthLayout = ({ children }) => {
  const pathname = usePathname();
  const { title, subline, prompt, linkLabel, href } = copyFor(
    pathname?.startsWith("/sign-up"),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 pt-22 pb-16 md:px-6 md:pt-26">
      <Link
        href="/"
        aria-label="Fortuno home"
        className="focus-visible:ring-ring/50 rounded-xs outline-none focus-visible:ring-3"
      >
        <span className="text-h4 font-heading text-foreground font-extrabold tracking-[-0.045em] lowercase">
          fortuno<span className="text-highlight-ink">.</span>
        </span>
      </Link>

      <h1 className="text-h2 font-heading text-foreground mt-7 text-center font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="text-body-sm text-muted-foreground mt-2 text-center text-balance">
        {subline}
      </p>

      <div className="mt-7 w-full">{children}</div>

      <p className="text-label font-heading text-muted-foreground mt-6 font-bold tracking-[.13em] uppercase">
        {prompt}{" "}
        <Link
          href={href}
          className="text-foreground hover:text-primary focus-visible:ring-ring/50 ease-standard rounded-xs underline underline-offset-4 transition-colors duration-(--animate-duration-fast) outline-none focus-visible:ring-3"
        >
          {linkLabel}
        </Link>
      </p>
    </div>
  );
};

export default AuthLayout;
