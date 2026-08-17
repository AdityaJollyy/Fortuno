"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

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

        if (!result.success) {
          setError(result.error);
          toast.error(result.error);
          return undefined;
        }

        setData(result.data);
        return result.data;
      } catch (err) {
        // Network failure, or the action threw instead of returning.
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
