"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-32 text-center">
      <h1 className="gradient-title text-5xl font-bold">
        Something went wrong
      </h1>
      <p className="text-muted-foreground max-w-md">
        We could not load this page. Please try again.
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          Reference: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
