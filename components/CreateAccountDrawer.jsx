"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const ACCOUNT_TYPE_LABELS = {
  CURRENT: "Current",
  SAVINGS: "Savings",
};

export function CreateAccountDrawer({
  children,
  nativeButton = false,
  onCreated,
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const { loading, fn: createAccountFn } = useFetch(createAccount);

  const onSubmit = async (values) => {
    const account = await createAccountFn(values);
    if (!account) return;

    toast.success("Account created successfully");
    reset();
    setOpen(false);
    onCreated?.(account);
  };

  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors)[0];
    toast.error(firstError?.message ?? "Please fix the highlighted fields");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger nativeButton={nativeButton} render={children} />

      {/* One shell at every width: a bottom sheet on mobile, the same sheet
          capped and centred above md. No second dialog, no media query. */}
      <DrawerContent className="md:data-[swipe-axis=y]:inset-x-[calc((100%-32rem)/2)]">
        <DrawerHeader>
          <DrawerTitle className="text-h4 font-bold tracking-tight">
            New account
          </DrawerTitle>
          <DrawerDescription>
            Balances are yours to enter — Fortuno doesn&apos;t connect to your
            bank.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-5 pb-6">
          {/* This drawer is used inside the transaction <form>. Base UI puts
              the drawer in a portal, so the DOM is not nested — but React
              events still bubble through the React tree, so a submit here
              would also submit the form that rendered the drawer. Stop it
              before react-hook-form runs. */}
          <form
            onSubmit={(event) => {
              event.stopPropagation();
              handleSubmit(onSubmit, onInvalid)(event);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., HDFC Current"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-sm" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue>
                        {(value) => ACCOUNT_TYPE_LABELS[value] ?? "Select type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_LABELS).map(
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
              {errors.type && (
                <p className="text-destructive text-sm" role="alert">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Opening balance</Label>
              <Input
                id="balance"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="tabular-nums"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-destructive text-sm" role="alert">
                  {errors.balance.message}
                </p>
              )}
            </div>

            <div className="border-border flex items-center justify-between rounded-md border p-3.5">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="isDefault">Make this my default</Label>
                <p className="text-muted-foreground text-sm">
                  Your budget follows the default account.
                </p>
              </div>
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isDefault"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <DrawerClose
                render={
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
