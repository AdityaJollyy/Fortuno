"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";

export default function useFetch(action, { onSuccess } = {}) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const resolveRef = useRef(null);
  const resultRef = useRef(undefined);

  // isPending going false is the signal that the new tree is on screen.
  useEffect(() => {
    if (isPending || !resolveRef.current) return;

    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve(resultRef.current);
  }, [isPending]);

  const fn = useCallback(
    (...args) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        resultRef.current = undefined;
        setError(null);

        startTransition(async () => {
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
              return;
            }

            setData(result.data);
            resultRef.current = result.data;
            onSuccessRef.current?.(result.data);
          } catch (err) {
            console.error(err);
            const message = "Something went wrong. Please try again.";
            setError(message);
            toast.error(message);
          }
        });
      }),
    [action],
  );

  return { data, loading: isPending, error, fn, setData };
}
