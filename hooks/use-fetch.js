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
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        toast.error(err.message || "Something went wrong");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { data, loading, error, fn, setData };
}
