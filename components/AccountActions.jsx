"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { updateAccountName, deleteAccount } from "@/actions/account";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Same limit the schema enforces, so the field stops before the server has to.
const MAX_NAME_LENGTH = 50;

// 44px targets on touch, the compact menu height once there is a pointer.
// Same shape as the row menus in TransactionTable and MobileNav.
const MENU_ITEM = "h-11 gap-2.5 px-2.5 md:h-8 md:gap-1.5 md:px-1.5";

// layout="menu"   — one ⋯ button, used where there is room for a header
//                   control and the page title already says which account.
// layout="inline"  — the two icons themselves, for the dashboard cards where
//                   the action should be one tap, not two.
export function AccountActions({
  accountId,
  name,
  transactionCount = 0,
  isDefault = false,
  redirectOnDelete = false,
  layout = "menu",
}) {
  const router = useRouter();

  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newName, setNewName] = useState(name);

  const { loading: renaming, fn: renameFn } = useFetch(updateAccountName);
  const { loading: deleting, fn: deleteFn } = useFetch(deleteAccount, {
    onSuccess: () => {
      if (redirectOnDelete) router.replace("/dashboard");
    },
  });

  const trimmedName = newName.trim();

  // Nothing to save when it is empty or unchanged, so the button says so
  // rather than sending a request that can only fail or do nothing.
  const canSave = trimmedName.length > 0 && trimmedName !== name;

  const handleRenameOpen = (open) => {
    // Always reopen with the name as it currently is, not with whatever was
    // half-typed and abandoned last time.
    if (open) setNewName(name);
    setRenameOpen(open);
  };

  const handleRename = async () => {
    const account = await renameFn(accountId, trimmedName);
    if (!account) return;

    setRenameOpen(false);
    toast.success("Account renamed");
  };

  const handleDelete = async () => {
    const result = await deleteFn(accountId);
    if (!result) return;

    setConfirmOpen(false);

    toast.success(
      result.promoted
        ? `Account deleted · ${result.promoted.name} is now the default`
        : "Account deleted",
    );
  };

  return (
    <>
      {layout === "inline" ? (
        // -mr-1.5 pulls the row back to the card's optical edge: the 44px
        // touch targets carry their own padding, so without it the icons
        // look inset next to the switch.
        <div className="-mr-1.5 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Rename ${name}`}
            onClick={() => handleRenameOpen(true)}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hover:text-destructive"
            aria-label={`Delete ${name}`}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${name}`}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className={MENU_ITEM}
              onClick={() => handleRenameOpen(true)}
            >
              <Pencil aria-hidden="true" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={MENU_ITEM}
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* ---------- Rename ---------- */}
      <Drawer open={renameOpen} onOpenChange={handleRenameOpen}>
        <DrawerContent className="md:data-[swipe-axis=y]:inset-x-[calc((100%-32rem)/2)]">
          <DrawerHeader>
            <DrawerTitle className="text-h4 font-bold tracking-tight">
              Rename account
            </DrawerTitle>
            <DrawerDescription>
              Only the name changes — the balance and every transaction stay
              where they are.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 overflow-y-auto px-5 pb-6">
            <div className="space-y-2">
              <Label htmlFor="accountName">Name</Label>
              <Input
                id="accountName"
                value={newName}
                maxLength={MAX_NAME_LENGTH}
                placeholder="e.g., HDFC Current"
                disabled={renaming}
                autoFocus
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  // One field, so Enter should save it.
                  if (event.key === "Enter" && canSave && !renaming) {
                    handleRename();
                  }
                }}
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
              <Button
                type="button"
                className="flex-1"
                onClick={handleRename}
                disabled={!canSave || renaming}
              >
                {renaming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save name"
                )}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Delete ---------- */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash className="text-destructive" aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {transactionCount === 1
                ? "Its 1 transaction goes with it. "
                : transactionCount > 0
                  ? `All ${transactionCount} of its transactions go with it. `
                  : ""}
              {/* The server promotes another account, but only if one is
                  left — so this cannot promise it outright. */}
              {isDefault
                ? "Your default moves to another account, if you have one. "
                : ""}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
