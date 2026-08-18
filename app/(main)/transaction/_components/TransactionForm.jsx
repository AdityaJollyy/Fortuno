"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

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

// One map drives both the trigger label and the items, so they cannot drift.
const TYPE_LABELS = {
  EXPENSE: "Expense",
  INCOME: "Income",
};

const RECURRING_INTERVAL_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function TransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
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
            accountId:
              accounts.find((account) => account.isDefault)?.id ?? null,
            category: null,
            date: new Date(),
            isRecurring: false,
            recurringInterval: null,
          },
  });

  const { loading, fn: submitFn } = useFetch(
    editMode ? updateTransaction : createTransaction,
  );

  const type = watch("type");
  const isRecurring = watch("isRecurring");

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  const onSubmit = async (values) => {
    // Amount stays a string all the way to Prisma. No parseFloat.
    const transaction = editMode
      ? await submitFn(initialData.id, values)
      : await submitFn(values);

    if (!transaction) return;

    toast.success(editMode ? "Transaction updated" : "Transaction created");
    reset();
    router.push(`/account/${transaction.accountId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                // Categories are type-specific, so the current one may no
                // longer be valid for the new type.
                setValue("category", null);
              }}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue>
                  {(value) => TYPE_LABELS[value] ?? "Select type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p className="text-destructive text-sm">{errors.type.message}</p>
        )}
      </div>

      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-destructive text-sm">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="accountId">Account</Label>
            <CreateAccountDrawer nativeButton>
              <Button type="button" variant="link" size="xs">
                <Plus className="h-3 w-3" />
                New account
              </Button>
            </CreateAccountDrawer>
          </div>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="accountId" className="w-full">
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
            <p className="text-destructive text-sm">
              {errors.accountId.message}
            </p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue>
                  {(value) =>
                    categories.find((category) => category.id === value)
                      ?.name ?? "Select category"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && (
          <p className="text-destructive text-sm">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    id="date"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start pl-3 font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.date && (
          <p className="text-destructive text-sm">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Enter description"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Recurring */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="isRecurring" className="text-base">
            Recurring Transaction
          </Label>
          <p className="text-muted-foreground text-sm">
            Set up a recurring schedule for this transaction
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
        <div className="space-y-2">
          <Label htmlFor="recurringInterval">Recurring Interval</Label>
          <Controller
            name="recurringInterval"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="recurringInterval" className="w-full">
                  <SelectValue>
                    {(value) =>
                      RECURRING_INTERVAL_LABELS[value] ?? "Select interval"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRING_INTERVAL_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.recurringInterval && (
            <p className="text-destructive text-sm">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions — flex-1, not w-full: Button carries shrink-0 */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
