"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDown,
  Camera,
  Check,
  ImageUp,
  ReceiptText,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { chipClass, defaultCategories } from "@/data/categories";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const ACCEPTED_LIST = ACCEPTED_TYPES.split(",");

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

const PANEL = "rounded-md border p-4 md:p-5";

// Buttons inside the scanner clear 44px on touch and shrink to the normal
// control height once there is a pointer.
const TOUCH = "h-11 md:h-9";

const CATEGORY_NAMES = Object.fromEntries(
  defaultCategories.map((category) => [category.id, category.name]),
);

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ReceiptScanner({ onScanComplete, onEnterManually }) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const readerRef = useRef(null);

  // idle → reading → scanning → success | failed. One value, so two states can
  // never be on screen at once.
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [picked, setPicked] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [dragging, setDragging] = useState(false);

  const { error, fn: scanReceiptFn } = useFetch(scanReceipt);

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setPicked(null);
    setReceipt(null);
  };

  const handleFile = (file) => {
    if (!file) return;

    // The action re-checks both of these; it is a public endpoint. These two
    // only exist to fail in the panel instead of after a round-trip.
    if (!ACCEPTED_LIST.includes(file.type)) {
      toast.error("Upload a JPEG, PNG, WebP or HEIC image");
      return;
    }

    if (file.size === 0 || file.size > MAX_RECEIPT_BYTES) {
      toast.error("Receipt must be smaller than 5MB");
      return;
    }

    setPicked({ name: file.name, size: file.size });
    setProgress(0);
    setStatus("reading");

    // A server action reports no upload progress, so the determinate phase is
    // the one thing here that genuinely is measurable: reading a 5MB phone
    // photo off storage. It is named for what it does, and it can be cancelled.
    const reader = new FileReader();
    readerRef.current = reader;

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    reader.onerror = () => {
      readerRef.current = null;
      setStatus("failed");
    };

    reader.onabort = () => {
      readerRef.current = null;
      reset();
    };

    reader.onload = async () => {
      readerRef.current = null;
      setProgress(100);
      setStatus("scanning");

      const scanned = await scanReceiptFn(file);

      // useFetch has already toasted the reason; the panel keeps it on screen.
      if (!scanned) {
        setStatus("failed");
        return;
      }

      setReceipt(scanned);
      setStatus("success");
      onScanComplete(scanned);
      toast.success("Receipt read.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];

    // Clear it immediately so picking the same file again still fires onChange.
    event.target.value = "";

    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleManual = () => {
    reset();
    onEnterManually?.();
  };

  return (
    <section aria-label="Receipt scanner">
      {/* Two inputs, because `capture` is what puts the phone straight into the
          camera and it must not hijack the desktop file picker. */}
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept={ACCEPTED_TYPES}
        capture="environment"
        onChange={handleChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={ACCEPTED_TYPES}
        onChange={handleChange}
      />

      {status === "idle" && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            PANEL,
            "border-input ease-standard border-dashed text-center transition-colors duration-(--animate-duration-fast)",
            dragging && "border-primary bg-accent",
          )}
        >
          <ReceiptText
            className="text-muted-foreground mx-auto size-6"
            aria-hidden="true"
          />

          <h2 className="text-h4 font-heading text-foreground mt-3 font-bold tracking-tight">
            Scan a receipt
          </h2>

          <p className="text-body-sm text-ink-body mx-auto mt-1.5 max-w-prose">
            JPEG, PNG, WebP or HEIC, up to 5MB. We read the amount, date and
            merchant — you check it before saving.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className={cn(TOUCH, "md:hidden")}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera aria-hidden="true" />
              Take photo
            </Button>

            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp aria-hidden="true" />
              Choose a file
            </Button>
          </div>

          <p className={cn(LABEL, "mt-4 hidden md:block")}>
            or drop one into this box
          </p>

          <button
            type="button"
            onClick={handleManual}
            className={cn(
              LABEL,
              "hover:text-foreground focus-visible:ring-ring ease-standard mx-auto mt-4 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2 transition-colors duration-(--animate-duration-fast) focus-visible:ring-2 focus-visible:outline-none md:mt-2 md:h-8",
            )}
          >
            Or enter it manually
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {status === "reading" && (
        <div className={cn(PANEL, "border-border")}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-body-sm text-foreground truncate font-medium">
              {picked.name}
            </p>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              onClick={() => readerRef.current?.abort()}
              aria-label="Cancel"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <Progress
            className="mt-3"
            value={progress}
            aria-label="Reading the file"
          />

          <p className={cn(LABEL, "mt-2.5")}>
            Reading the file · {progress}% · {formatSize(picked.size)}
          </p>
        </div>
      )}

      {status === "scanning" && (
        <div className={cn(PANEL, "border-border")}>
          <p className="text-body-sm text-foreground truncate font-medium">
            {picked.name}
          </p>

          <div
            role="progressbar"
            aria-label="Reading the receipt"
            className="bg-muted relative mt-3 h-2 w-full overflow-hidden rounded-xs"
          >
            <span
              className="scan-sweep bg-primary absolute inset-y-0 left-0 w-1/3 rounded-xs"
              aria-hidden="true"
            />
          </div>

          <p className={cn(LABEL, "mt-2.5")}>
            Reading the receipt… · usually 3–5 seconds
          </p>
        </div>
      )}

      {status === "success" && (
        <div className={cn(PANEL, "border-positive/40 bg-card")}>
          <p className={cn(LABEL, "text-positive flex items-center gap-1.5")}>
            <Check className="size-3.5" aria-hidden="true" />
            Read · check it
          </p>

          <p className="text-money-lg font-heading text-foreground mt-2 font-extrabold tabular-nums">
            {formatCurrency(receipt.amount)}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <p className={LABEL}>
              {format(new Date(receipt.date), "dd MMM yyyy")}
              {receipt.description ? ` · ${receipt.description}` : ""}
            </p>

            {receipt.category && (
              <Badge variant="category" className={chipClass(receipt.category)}>
                {CATEGORY_NAMES[receipt.category] ?? receipt.category}
              </Badge>
            )}
          </div>

          <p className="text-body-sm text-ink-body mt-3 max-w-prose">
            The fields below are filled in — edit anything.
          </p>

          <Button
            type="button"
            variant="outline"
            className={cn(TOUCH, "mt-4")}
            onClick={reset}
          >
            <RotateCcw aria-hidden="true" />
            Scan another
          </Button>
        </div>
      )}

      {status === "failed" && (
        <div className={cn(PANEL, "border-destructive/50")}>
          <p
            className={cn(LABEL, "text-destructive flex items-center gap-1.5")}
          >
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            Couldn&apos;t read it
          </p>

          <p
            role="alert"
            className="text-body-sm text-ink-body mt-2 max-w-prose"
          >
            {error ?? "Something went wrong reading that image."}
          </p>

          <p className="text-body-sm text-muted-foreground mt-1.5 max-w-prose">
            Try again in better light, or just type it in — it takes about ten
            seconds.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className={TOUCH}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp aria-hidden="true" />
              Try another photo
            </Button>

            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              onClick={handleManual}
            >
              Enter manually
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
