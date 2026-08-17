"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/account";
import { formatCurrency } from "@/lib/format";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const { loading, fn: updateDefaultFn } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (checked) => {
    if (!checked) {
      toast.warning("You need at least one default account");
      return;
    }

    const updated = await updateDefaultFn(id);
    if (!updated) return;

    toast.success("Default account updated");
  };

  return (
    <Card className="relative transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="capitalize">{name}</CardTitle>
        {/* z-10 keeps the switch above the full-card link below */}
        <CardAction className="relative z-10">
          {loading ? (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <Switch checked={isDefault} onCheckedChange={handleDefaultChange} />
          )}
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
        <p className="text-muted-foreground text-xs">
          {type.charAt(0) + type.slice(1).toLowerCase()} Account
        </p>
      </CardContent>

      <CardFooter className="text-muted-foreground flex justify-between text-sm">
        <div className="flex items-center">
          <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
          Income
        </div>
        <div className="flex items-center">
          <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
          Expense
        </div>
      </CardFooter>

      <Link
        href={`/account/${id}`}
        className="absolute inset-0"
        aria-label={`View ${name} account`}
      />
    </Card>
  );
}
