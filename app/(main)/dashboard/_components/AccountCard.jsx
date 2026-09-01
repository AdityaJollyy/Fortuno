"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/account";
import { formatCurrency } from "@/lib/format";

import { AccountActions } from "@/components/AccountActions";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;
  const transactionCount = account._count?.transactions ?? 0;

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
    <Card className="hover:bg-accent ease-standard relative transition-colors duration-(--animate-duration-fast)">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 capitalize">
          {name}
          {isDefault && (
            <Badge
              variant="category"
              className="bg-muted text-muted-foreground"
            >
              Default
            </Badge>
          )}
        </CardTitle>

        {/* z-10 keeps these controls above the full-card link below */}
        <CardAction className="relative z-10 flex items-center gap-1">
          {loading ? (
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          ) : (
            <Switch
              checked={isDefault}
              onCheckedChange={handleDefaultChange}
              aria-label={`Make ${name} the default account`}
            />
          )}

          <AccountActions
            accountId={id}
            name={name}
            transactionCount={transactionCount}
            isDefault={isDefault}
            layout="inline"
          />
        </CardAction>
      </CardHeader>

      <CardContent>
        <p className="text-money-lg font-heading text-foreground font-extrabold tabular-nums">
          {formatCurrency(balance)}
        </p>
        <p className={`${LABEL} mt-2`}>
          {type.charAt(0) + type.slice(1).toLowerCase()} ·{" "}
          {transactionCount === 1
            ? "1 transaction"
            : `${transactionCount} transactions`}
        </p>
      </CardContent>

      <Link
        href={`/account/${id}`}
        className="absolute inset-0"
        aria-label={`View ${name} account`}
      />
    </Card>
  );
}
