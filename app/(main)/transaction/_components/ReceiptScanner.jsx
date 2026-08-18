"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

import { Button } from "@/components/ui/button";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);

  const { loading, fn: scanReceiptFn } = useFetch(scanReceipt);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];

    // Clear it immediately so picking the same file again still fires onChange.
    event.target.value = "";

    if (!file) return;

    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error("Receipt must be smaller than 5MB");
      return;
    }

    const receipt = await scanReceiptFn(file);
    if (!receipt) return;

    onScanComplete(receipt);
    toast.success("Receipt scanned");
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={ACCEPTED_TYPES}
        capture="environment"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 text-white transition-opacity hover:text-white hover:opacity-90"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            Scanning Receipt...
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            Scan Receipt with AI
          </>
        )}
      </Button>
    </div>
  );
}
