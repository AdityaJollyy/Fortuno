"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { add, format } from "date-fns";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { chipClass } from "@/data/categories";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { setFlash } from "@/components/FlashToast";
import { ReceiptScanner } from "./ReceiptScanner";

// One map drives both the trigger label and the items, so they cannot drift.
const TYPE_LABELS = {
  EXPENSE: "Expense",
  INCOME: "Income",
};

// The sign is what carries expense/income in a grayscale screenshot; the tint
// on the selected segment is the second signal, never the only one.
const TYPE_SIGNS = {
  EXPENSE: "−",
  INCOME: "+",
};

const RECURRING_INTERVAL_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// Feeds date-fns `add`, so "Next on" is a real date rather than a guess.
const RECURRING_STEP = {
  DAILY: { days: 1 },
  WEEKLY: { weeks: 1 },
  MONTHLY: { months: 1 },
  YEARLY: { years: 1 },
};

// Expense has fifteen categories. Showing all of them pushes the date and the
// save button off a 375 screen, so the rest sit behind one tap.
const CATEGORY_PREVIEW = 8;

// Touch targets clear 44px below md and settle to the normal control height
// once there is a pointer.
const CHIP =
  "text-body-sm font-heading focus-visible:ring-ring ease-standard inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xs border px-3 font-semibold transition-colors duration-(--animate-duration-fast) focus-visible:ring-2 focus-visible:outline-none md:h-9";

const CHIP_OFF =
  "border-border text-muted-foreground hover:bg-accent hover:text-foreground";

const CHIP_ON = "border-primary bg-primary text-primary-foreground";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export function TransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();

  const [showAllCategories, setShowAllCategories] = useState(false);

  // Controlled so picking a day can close the popover; uncontrolled it stays
  // open until the user clicks away.
  const [dateOpen, setDateOpen] = useState(false);

  // Hoisted so useWatch below can reuse the same initial values instead of
  // repeating them, which would let the two drift apart.
  const defaultValues =
    editMode && initialData
      ? {
          type: initialData.type,
          amount: initialData.amount.toString(),
          description: initialData.description ?? "",
          accountId: initialData.accountId,
          category: initialData.category,
          date: new Date(initialData.date),
          isRecurring: initialData.isRecurring,
          recurringInterval: initialData.recurringInterval ?? null,
        }
      : {
          type: "EXPENSE",
          amount: "",
          description: "",
          accountId: accounts.find((account) => account.isDefault)?.id ?? null,
          category: null,
          date: new Date(),
          isRecurring: false,
          recurringInterval: null,
        };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setFocus,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const { loading, fn: submitFn } = useFetch(
    editMode ? updateTransaction : createTransaction,
    {
      onSuccess: (transaction) => {
        // Parked, not fired: the account page shows it once it is on screen,
        // so the confirmation never flashes on the form the user is leaving.
        setFlash(editMode ? "Transaction updated" : "Transaction created");
        reset();
        router.push(`/account/${transaction.accountId}`);
      },
    },
  );

  // useWatch, not watch(): watch() returns a function React Compiler cannot
  // memoize safely, so it skips optimising the whole component.
  const type = useWatch({
    control,
    name: "type",
    defaultValue: defaultValues.type,
  });

  const isRecurring = useWatch({
    control,
    name: "isRecurring",
    defaultValue: defaultValues.isRecurring,
  });

  const recurringInterval = useWatch({
    control,
    name: "recurringInterval",
    defaultValue: defaultValues.recurringInterval,
  });

  const date = useWatch({
    control,
    name: "date",
    defaultValue: defaultValues.date,
  });

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  const visibleCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, CATEGORY_PREVIEW);

  const hiddenCategoryCount =
    filteredCategories.length - visibleCategories.length;

  const nextDate =
    isRecurring && recurringInterval && date
      ? add(date, RECURRING_STEP[recurringInterval])
      : null;

  const onSubmit = async (values) => {
    // Amount stays a string all the way to Prisma. No parseFloat.
    if (editMode) {
      await submitFn(initialData.id, values);
    } else {
      await submitFn(values);
    }
  };

  // Errors on conditionally-rendered fields have nowhere to display, which
  // would make the submit button do nothing with no explanation.
  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors)[0];
    toast.error(firstError?.message ?? "Please fix the highlighted fields");
  };

  const handleScanComplete = (receipt) => {
    setValue("amount", receipt.amount);
    setValue("date", receipt.date);

    if (receipt.description) {
      setValue("description", receipt.description);
    }

    // Every scannable category is an expense, so set both together —
    // otherwise the schema rejects the type/category mismatch on submit.
    if (receipt.category) {
      setValue("type", "EXPENSE");
      setValue("category", receipt.category);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-6 md:space-y-7"
    >
      {/* Receipt Scanner — create mode only */}
      {!editMode && (
        <ReceiptScanner
          onScanComplete={handleScanComplete}
          onEnterManually={() => setFocus("amount")}
        />
      )}

      {/* Type — a segmented control, not a Select: two options that both fit */}
      <fieldset>
        <legend className={LABEL}>Type</legend>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={field.value === value}
                  onClick={() => {
                    field.onChange(value);
                    // Categories are type-specific, so the current one may no
                    // longer be valid for the new type.
                    setValue("category", null);
                  }}
                  className={cn(
                    CHIP,
                    "justify-center",
                    field.value === value ? CHIP_ON : CHIP_OFF,
                  )}
                >
                  <span aria-hidden="true">{TYPE_SIGNS[value]}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        />
        {errors.type && (
          <p className="text-destructive mt-2 text-sm" role="alert">
            {errors.type.message}
          </p>
        )}
      </fieldset>

      {/* Amount — the one number the screen is about */}
      <div className="space-y-2">
        <Label
          htmlFor="amount"
          className={cn(errors.amount && "text-destructive")}
        >
          Amount
        </Label>

        <div
          className={cn(
            "border-input focus-within:border-ring focus-within:ring-ring/50 flex items-baseline justify-center gap-1 rounded-md border px-4 py-5 focus-within:ring-3",
            errors.amount && "border-destructive ring-destructive/20 ring-3",
          )}
        >
          <span
            className="text-money-lg font-heading text-muted-foreground font-extrabold"
            aria-hidden="true"
          >
            ₹
          </span>

          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            // The wrapper draws the focus and error rings, so the input inside
            // it must not draw a second one.
            className="text-money-lg md:text-money-xl font-heading h-auto border-0 bg-transparent p-0 text-center font-extrabold tabular-nums focus-visible:ring-0 aria-invalid:ring-0"
            {...register("amount")}
          />
        </div>

        {errors.amount && (
          <p
            id="amount-error"
            className="text-destructive text-sm"
            role="alert"
          >
            {errors.amount.message}
          </p>
        )}
      </div>

      {/* Account and Date */}
      <div className="grid gap-6 md:grid-cols-2 md:gap-5">
        {/* Account */}
        <div className="space-y-2">
          <div className="flex h-5 items-center justify-between">
            <Label
              htmlFor="accountId"
              className={cn(errors.accountId && "text-destructive")}
            >
              Account
            </Label>

            {/* accounts comes from the server component, so the new one is
                only in the list after a refresh — select it either way. */}
            <CreateAccountDrawer
              nativeButton
              onCreated={(account) => {
                setValue("accountId", account.id);
              }}
            >
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-5 px-1"
              >
                <Plus className="size-3" aria-hidden="true" />
                New account
              </Button>
            </CreateAccountDrawer>
          </div>

          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="accountId"
                  className="h-11 w-full md:h-9"
                  aria-invalid={Boolean(errors.accountId)}
                >
                  <SelectValue>
                    {(value) =>
                      accounts.find((account) => account.id === value)?.name ??
                      "Select account"
                    }
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.accountId && (
            <p className="text-destructive text-sm" role="alert">
              {errors.accountId.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <div className="flex h-5 items-center">
            <Label
              htmlFor="date"
              className={cn(errors.date && "text-destructive")}
            >
              Date
            </Label>
          </div>

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="date"
                      type="button"
                      variant="outline"
                      aria-invalid={Boolean(errors.date)}
                      className={cn(
                        "h-11 w-full justify-start pl-3 font-normal md:h-9",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? format(field.value, "dd MMM yyyy")
                        : "Pick a date"}
                      <CalendarIcon
                        className="ml-auto size-4 opacity-50"
                        aria-hidden="true"
                      />
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(day) => {
                      // react-day-picker passes undefined when the selected
                      // day is clicked again — keep the date already there.
                      if (day) field.onChange(day);
                      setDateOpen(false);
                    }}
                    disabled={(day) =>
                      day > new Date() || day < new Date("1900-01-01")
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />

          {errors.date && (
            <p className="text-destructive text-sm" role="alert">
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      {/* Category — a chip grid, so the choice is one tap and the colour that
          the rest of the app uses for this category is visible while choosing */}
      <fieldset>
        <legend className={cn(LABEL, errors.category && "text-destructive")}>
          Category
        </legend>

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {visibleCategories.map((category) => {
                const selected = field.value === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => field.onChange(category.id)}
                    className={cn(
                      CHIP,
                      selected
                        ? cn(
                            "ring-primary border-transparent ring-2",
                            chipClass(category.id),
                          )
                        : CHIP_OFF,
                    )}
                  >
                    {selected && (
                      <Check className="size-3.5" aria-hidden="true" />
                    )}
                    {category.name}
                  </button>
                );
              })}

              {hiddenCategoryCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(true)}
                  className={cn(CHIP, CHIP_OFF)}
                >
                  All {filteredCategories.length}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        />

        {errors.category && (
          <p className="text-destructive mt-2 text-sm" role="alert">
            {errors.category.message}
          </p>
        )}
      </fieldset>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className={cn(errors.description && "text-destructive")}
        >
          Description
        </Label>
        <Input
          id="description"
          placeholder="e.g., Thattu, dinner"
          className="h-11 md:h-9"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-destructive text-sm" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Repeats */}
      <div className="border-border space-y-4 rounded-md border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="isRecurring">Repeats</Label>
            <p className="text-muted-foreground text-sm">
              Rent, subscriptions, EMIs.
            </p>
          </div>
          <Controller
            name="isRecurring"
            control={control}
            render={({ field }) => (
              <Switch
                id="isRecurring"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {isRecurring && (
          <fieldset>
            <legend
              className={cn(
                LABEL,
                errors.recurringInterval && "text-destructive",
              )}
            >
              How often
            </legend>

            <Controller
              name="recurringInterval"
              control={control}
              render={({ field }) => (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {Object.entries(RECURRING_INTERVAL_LABELS).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={field.value === value}
                        onClick={() => field.onChange(value)}
                        className={cn(
                          CHIP,
                          field.value === value ? CHIP_ON : CHIP_OFF,
                        )}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            />

            {nextDate && (
              <p className={cn(LABEL, "mt-3")}>
                Next on {format(nextDate, "dd MMM yyyy")}
              </p>
            )}

            {errors.recurringInterval && (
              <p className="text-destructive mt-2 text-sm" role="alert">
                {errors.recurringInterval.message}
              </p>
            )}
          </fieldset>
        )}
      </div>

      {/* Actions — sticky above the keyboard on mobile, in flow from md.
          flex-1, not w-full: Button carries shrink-0 */}
      <div className="bg-background/95 border-border sticky bottom-0 z-10 -mx-5 flex gap-3 border-t px-5 py-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 md:h-9"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11 flex-1 md:h-9" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : editMode ? (
            "Save changes"
          ) : (
            "Save transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
