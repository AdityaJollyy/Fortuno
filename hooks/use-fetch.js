"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

// Runs a server action from a client component: tracks pending state and
// toasts on failure. Returns the action's data, or undefined if it failed.
export default function useFetch(action) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fn = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (!result || typeof result.success !== "boolean") {
          throw new Error(
            "Action must return ok() or fail() from lib/action.js",
          );
        }

        if (!result.success) {
          setError(result.error);
          toast.error(result.error);
          return undefined;
        }

        setData(result.data);
        return result.data;
      } catch (err) {
        console.error(err);
        const message = "Something went wrong. Please try again.";
        setError(message);
        toast.error(message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { data, loading, error, fn, setData };
}
