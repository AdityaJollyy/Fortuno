"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// A toast fired right before router.push() dies with the form: useFetch resolves
// its promise from an effect, and the form unmounts as the new route commits, so
// that effect never runs. Park the message instead and let the destination page
// show it once it is actually on screen.
const KEY = "fortuno:flash";

export function setFlash(message) {
  try {
    sessionStorage.setItem(KEY, message);
  } catch {
    // Private mode / storage disabled — the toast is not worth failing over.
  }
}

export function FlashToast() {
  useEffect(() => {
    let message = null;

    try {
      message = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      return;
    }

    if (message) toast.success(message);
  }, []);

  return null;
}
