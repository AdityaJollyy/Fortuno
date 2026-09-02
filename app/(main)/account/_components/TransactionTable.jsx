"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Receipt,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/account";
import { defaultCategories, chipClass } from "@/data/categories";
import { formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { SectionLoader } from "@/components/SectionLoader";
import { BulkActionBar } from "./BulkActionBar";

const ITEMS_PER_PAGE = 20;

// Mirrors transactionIdsSchema's own .max(500) so the limit is visible before
// the user commits, not after the action rejects the request.
const MAX_BULK_DELETE = 500;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const TYPE_FILTER_LABELS = {
  ALL: "All Types",
  INCOME: "Income",
  EXPENSE: "Expense",
};

const RECURRING_FILTER_LABELS = {
  ALL: "All Transactions",
  RECURRING: "Recurring Only",
  ONE_TIME: "Non-recurring Only",
};

const SORT_OPTIONS = [
  { field: "date", direction: "desc", label: "Date — newest first" },
  { field: "date", direction: "asc", label: "Date — oldest first" },
  { field: "amount", direction: "desc", label: "Amount — highest first" },
  { field: "amount", direction: "asc", label: "Amount — lowest first" },
  { field: "category", direction: "asc", label: "Category — A to Z" },
  { field: "category", direction: "desc", label: "Category — Z to A" },
];

const CATEGORY_NAMES = Object.fromEntries(
  defaultCategories.map((category) => [category.id, category.name]),
);

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

// Row menus are the same on both layouts: 44px targets on touch, the compact
// menu height once there is a pointer. Same shape as MobileNav's items.
const MENU_ITEM = "h-11 gap-2.5 px-2.5 md:h-8 md:gap-1.5 md:px-1.5";

function categoryName(id) {
  return CATEGORY_NAMES[id] ?? id;
}

// Used by both filter groups in the mobile sheet. Local to this file — the
// desktop row keeps the Select primitive and its "ALL" sentinel.
function ChipGroup({ legend, value, labels, onChange }) {
  return (
    <fieldset>
      <legend className={LABEL}>{legend}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {Object.entries(labels).map(([optionValue, label]) => (
          <button
            key={optionValue}
            type="button"
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
            className={cn(
              "text-body-sm font-heading focus-visible:ring-ring ease-standard inline-flex h-11 cursor-pointer items-center rounded-xs border px-3 font-semibold transition-colors duration-(--animate-duration-fast) focus-visible:ring-2 focus-visible:outline-none",
              value === optionValue
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function TransactionTable({ transactions }) {
  const router = useRouter();

  // Where focus lands after a delete. The dialog restores focus to the button
  // that opened it, but that button is inside a row — or inside the selection
  // bar — that the delete then unmounts, dropping focus to <body>. Focusing
  // this section instead means the next Tab resumes here, not at the top of
  // the page. See the comment on the wrapper below.
  const regionRef = useRef(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [recurringFilter, setRecurringFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);

  const { loading: deleteLoading, fn: deleteFn } = useFetch(
    bulkDeleteTransactions,
  );

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower),
      );
    }

    if (typeFilter !== "ALL") {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    if (recurringFilter !== "ALL") {
      result = result.filter((transaction) =>
        recurringFilter === "RECURRING"
          ? transaction.isRecurring
          : !transaction.isRecurring,
      );
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE),
  );

  // Clamp so a filter change can never strand the user on an empty page.
  const page = Math.min(currentPage, totalPages);

  // Two windows onto one derived list: the table pages through it, the card
  // list accumulates. Filtering, sorting and selection never fork.
  const paginatedTransactions = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredAndSortedTransactions, page]);

  const mobileTransactions = useMemo(
    () => filteredAndSortedTransactions.slice(0, page * ITEMS_PER_PAGE),
    [filteredAndSortedTransactions, page],
  );

  // Consecutive runs, so the grouping always follows the current sort order.
  const mobileGroups = useMemo(() => {
    const groups = [];

    for (const transaction of mobileTransactions) {
      const date = new Date(transaction.date);
      const key = format(date, "yyyy-MM-dd");
      const last = groups.at(-1);

      if (last?.key === key) {
        last.items.push(transaction);
      } else {
        groups.push({
          key,
          label: format(date, "dd MMM · EEE"),
          items: [transaction],
        });
      }
    }

    return groups;
  }, [mobileTransactions]);

  const amountById = useMemo(
    () => new Map(transactions.map((t) => [t.id, t.amount])),
    [transactions],
  );

  const selectedTotal = selectedIds.reduce(
    (sum, id) => sum + (amountById.get(id) ?? 0),
    0,
  );

  const allOnPageSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((t) => selectedIds.includes(t.id));

  const hasFilters =
    searchTerm || typeFilter !== "ALL" || recurringFilter !== "ALL";

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0) +
    (recurringFilter !== "ALL" ? 1 : 0);

  const selectionMode = selectMode || selectedIds.length > 0;

  const showDateGroups = sortConfig.field === "date";

  const rangeStart =
    filteredAndSortedTransactions.length === 0
      ? 0
      : (page - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(
    page * ITEMS_PER_PAGE,
    filteredAndSortedTransactions.length,
  );

  // First, last and the window around the current page. Gaps become an "…".
  const pageNumbers = useMemo(() => {
    const wanted = [1, totalPages, page, page - 1, page + 1];
    return [...new Set(wanted)]
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
  }, [page, totalPages]);

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSortSelect = (field, direction) => {
    setSortConfig({ field, direction });
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(
      allOnPageSelected ? [] : paginatedTransactions.map((t) => t.id),
    );
  };

  const handleSelectAllMatching = () => {
    setSelectedIds(filteredAndSortedTransactions.map((t) => t.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectMode(false);
  };

  const handleToggleSelectMode = () => {
    if (selectionMode) {
      handleClearSelection();
      return;
    }

    setSelectMode(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setRecurringFilter("ALL");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleLoadMore = () => {
    setCurrentPage(page + 1);
  };

  const handleDeleteRequest = (ids) => {
    setPendingIds(ids);
  };

  const handleDeleteConfirm = async () => {
    const ids = pendingIds;
    setPendingIds([]);

    const result = await deleteFn(ids);
    if (!result) return;

    handleClearSelection();
    // Before the refresh: the rows the user was standing in are about to go.
    regionRef.current?.focus();
    toast.success(`${result.count} transaction(s) deleted`);
  };

  const emptyState = (
    <div className="border-border rounded-md border px-5 py-12 text-center">
      <p className={LABEL}>{hasFilters ? "No matches" : "Nothing here yet"}</p>

      <p className="text-body text-ink-body mt-3">
        {hasFilters
          ? `Nothing here${searchTerm ? ` for “${searchTerm}”` : ""}.`
          : "This account has no transactions yet."}
      </p>

      <p className="text-body-sm text-muted-foreground mt-1">
        {hasFilters
          ? "Try a wider search, or clear the type and recurring filters."
          : "Add the first one and Fortuno starts counting."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
        <Button
          render={<Link href="/transaction/create" />}
          nativeButton={false}
        >
          Add transaction
        </Button>
      </div>
    </div>
  );

  return (
    // tabIndex={-1} makes this a programmatic focus target only — it never
    // enters the Tab order, so `outline-none` hides a ring the user cannot
    // have asked for. Every control inside keeps its own focus-visible ring.
    <div ref={regionRef} tabIndex={-1} className="space-y-4 outline-none">
      {deleteLoading && <SectionLoader />}

      {/* Search sits in the row at every width. The two icon buttons beside it
          are mobile-only; above md the filters are inline Selects. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            placeholder="Search description"
            aria-label="Search description"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 pl-9 md:h-8"
          />
        </div>

        <div className="flex gap-2 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setFilterSheetOpen(true)}
            aria-label={`Filter and sort${activeFilterCount ? ` (${activeFilterCount} active)` : ""}`}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-label font-heading absolute -top-1 -right-1 grid size-4 place-content-center rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="icon"
            onClick={handleToggleSelectMode}
            aria-pressed={selectionMode}
            aria-label="Select transactions"
          >
            <ListChecks className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="hidden gap-2 md:flex">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]" aria-label="Type">
              <SelectValue>{(value) => TYPE_FILTER_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => {
              setRecurringFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[170px]" aria-label="Recurring">
              <SelectValue>
                {(value) => RECURRING_FILTER_LABELS[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RECURRING_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleClearFilters}
              aria-label="Clear filters"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters, spelled out. Mobile only — above md the Selects
          already show their own value. */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 md:hidden">
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className={`${LABEL} border-border hover:bg-accent inline-flex h-8 max-w-full items-center gap-1.5 rounded-xs border px-2.5`}
            >
              <span className="truncate">“{searchTerm}”</span>
              <X className="size-3 shrink-0" aria-hidden="true" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          {typeFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`${LABEL} border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-xs border px-2.5`}
            >
              {TYPE_FILTER_LABELS[typeFilter]}
              <X className="size-3" aria-hidden="true" />
              <span className="sr-only">Clear type filter</span>
            </button>
          )}
          {recurringFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setRecurringFilter("ALL")}
              className={`${LABEL} border-border hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-xs border px-2.5`}
            >
              {RECURRING_FILTER_LABELS[recurringFilter]}
              <X className="size-3" aria-hidden="true" />
              <span className="sr-only">Clear recurring filter</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClearFilters}
            className={`${LABEL} hover:text-foreground h-8 px-1`}
          >
            Clear all
          </button>
        </div>
      )}

      {filteredAndSortedTransactions.length === 0 ? (
        emptyState
      ) : (
        <>
          {/* ---------- Mobile: date-grouped card list ---------- */}
          <div className="md:hidden">
            {mobileGroups.map((group) => (
              <section key={group.key}>
                {showDateGroups && (
                  <h3
                    className={`${LABEL} bg-background sticky top-16 z-10 py-2`}
                  >
                    {group.label}
                  </h3>
                )}

                <ul>
                  {group.items.map((transaction) => {
                    const selected = selectedIds.includes(transaction.id);
                    const description =
                      transaction.description || "Untitled transaction";

                    const body = (
                      <>
                        {selectionMode && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 grid size-5 shrink-0 place-content-center rounded-[4px] border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input",
                            )}
                          >
                            {selected && <Check className="size-3.5" />}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm text-foreground truncate font-medium">
                            {description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="category"
                              className={chipClass(transaction.category)}
                            >
                              {categoryName(transaction.category)}
                            </Badge>
                            {transaction.isRecurring && (
                              <span
                                className={`${LABEL} inline-flex items-center gap-1`}
                              >
                                <RefreshCw
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                {RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ] ?? "Recurring"}
                                {transaction.nextRecurringDate
                                  ? ` · Next ${format(new Date(transaction.nextRecurringDate), "dd MMM")}`
                                  : ""}
                              </span>
                            )}
                            {!showDateGroups && (
                              <time className={LABEL}>
                                {format(new Date(transaction.date), "dd MMM")}
                              </time>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-money font-heading inline-flex items-center gap-1 font-semibold tabular-nums",
                              transaction.type === "EXPENSE"
                                ? "text-destructive"
                                : "text-positive",
                            )}
                          >
                            {transaction.type === "EXPENSE" ? (
                              <ArrowDownRight
                                className="size-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpRight
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                            {formatSigned(transaction.amount, transaction.type)}
                          </p>
                          {transaction.receiptUrl && (
                            <p
                              className={`${LABEL} mt-1 inline-flex items-center gap-1`}
                            >
                              <Receipt className="size-3" aria-hidden="true" />
                              Receipt
                            </p>
                          )}
                        </div>
                      </>
                    );

                    return (
                      <li
                        key={transaction.id}
                        className={cn(
                          "border-border flex items-start gap-3 border-b py-3.5 last:border-0",
                          selected && "bg-primary/8",
                        )}
                      >
                        {selectionMode ? (
                          <button
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Select ${description}`}
                            onClick={() => handleSelect(transaction.id)}
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                          >
                            {body}
                          </button>
                        ) : (
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            {body}
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${description}`}
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className={MENU_ITEM}
                              onClick={() =>
                                router.push(
                                  `/transaction/create?edit=${transaction.id}`,
                                )
                              }
                            >
                              <Pencil aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={MENU_ITEM}
                              variant="destructive"
                              onClick={() =>
                                handleDeleteRequest([transaction.id])
                              }
                            >
                              <Trash aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {mobileTransactions.length <
              filteredAndSortedTransactions.length && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={handleLoadMore}
              >
                Load {ITEMS_PER_PAGE} more · {mobileTransactions.length} of{" "}
                {filteredAndSortedTransactions.length}
              </Button>
            )}
          </div>

          {/* ---------- md and up: the table ---------- */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px] pl-3">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      field="date"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Date
                    </SortButton>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <SortButton
                      field="category"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Category
                    </SortButton>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Recurring
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton
                      field="amount"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                    >
                      Amount
                    </SortButton>
                  </TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedTransactions.map((transaction) => {
                  const selected = selectedIds.includes(transaction.id);
                  const description =
                    transaction.description || "Untitled transaction";

                  return (
                    <TableRow
                      key={transaction.id}
                      data-state={selected ? "selected" : undefined}
                    >
                      <TableCell className="pl-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => handleSelect(transaction.id)}
                          aria-label={`Select ${description}`}
                        />
                      </TableCell>

                      <TableCell className="text-muted-foreground tabular-nums">
                        {format(new Date(transaction.date), "dd MMM yy")}
                      </TableCell>

                      <TableCell className="text-foreground max-w-[22ch] truncate font-medium lg:max-w-[36ch]">
                        {description}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="category"
                            className={chipClass(transaction.category)}
                          >
                            {categoryName(transaction.category)}
                          </Badge>
                          {/* Recurring folds in here until lg gives it a
                              column of its own. */}
                          {transaction.isRecurring && (
                            <span
                              className={`${LABEL} inline-flex items-center gap-1 lg:hidden`}
                            >
                              <RefreshCw
                                className="size-3"
                                aria-hidden="true"
                              />
                              {RECURRING_INTERVALS[
                                transaction.recurringInterval
                              ] ?? "Recurring"}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {transaction.isRecurring ? (
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <Badge variant="secondary" className="gap-1">
                                <RefreshCw
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                {RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ] ?? "Recurring"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">Next Date:</div>
                                <div>
                                  {transaction.nextRecurringDate
                                    ? format(
                                        new Date(transaction.nextRecurringDate),
                                        "PPP",
                                      )
                                    : "Not scheduled"}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            One-time
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-money font-heading text-right font-semibold tabular-nums",
                          transaction.type === "EXPENSE"
                            ? "text-destructive"
                            : "text-positive",
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {transaction.type === "EXPENSE" ? (
                            <ArrowDownRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowUpRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          )}
                          {formatSigned(transaction.amount, transaction.type)}
                          {transaction.receiptUrl && (
                            <Receipt
                              className="text-muted-foreground size-3.5"
                              aria-label="Has receipt"
                            />
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${description}`}
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className={MENU_ITEM}
                              onClick={() =>
                                router.push(
                                  `/transaction/create?edit=${transaction.id}`,
                                )
                              }
                            >
                              <Pencil aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={MENU_ITEM}
                              variant="destructive"
                              onClick={() =>
                                handleDeleteRequest([transaction.id])
                              }
                            >
                              <Trash aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ---------- md and up: pagination ---------- */}
          <div className="hidden items-center justify-between gap-3 md:flex">
            <p className={LABEL}>
              {rangeStart}–{rangeEnd} of {filteredAndSortedTransactions.length}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>

              <span className={`${LABEL} px-2 lg:hidden`}>
                {page} / {totalPages}
              </span>

              <div className="hidden items-center gap-1 lg:flex">
                {pageNumbers.map((number, index) => (
                  <span key={number} className="flex items-center gap-1">
                    {index > 0 && number - pageNumbers[index - 1] > 1 && (
                      <span className={`${LABEL} px-1`} aria-hidden="true">
                        …
                      </span>
                    )}
                    <Button
                      variant={number === page ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => handlePageChange(number)}
                      aria-label={`Page ${number}`}
                      aria-current={number === page ? "page" : undefined}
                    >
                      {number}
                    </Button>
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          total={selectedTotal}
          matchingCount={filteredAndSortedTransactions.length}
          maxSelectable={MAX_BULK_DELETE}
          onSelectAllMatching={handleSelectAllMatching}
          onClear={handleClearSelection}
          onDelete={() => handleDeleteRequest(selectedIds)}
          deleting={deleteLoading}
        />
      )}

      {/* ---------- Mobile filter + sort sheet ---------- */}
      <Drawer open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <DrawerContent className="md:hidden">
          <DrawerHeader>
            <DrawerTitle>Filter &amp; sort</DrawerTitle>
            <DrawerDescription>
              Applies to the whole account, not just the rows on screen.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-6 overflow-y-auto px-4 pb-4">
            <ChipGroup
              legend="Type"
              value={typeFilter}
              labels={TYPE_FILTER_LABELS}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            />

            <ChipGroup
              legend="Recurring"
              value={recurringFilter}
              labels={RECURRING_FILTER_LABELS}
              onChange={(value) => {
                setRecurringFilter(value);
                setCurrentPage(1);
              }}
            />

            <fieldset>
              <legend className={LABEL}>Sort by</legend>
              <ul className="mt-2.5">
                {SORT_OPTIONS.map((option) => {
                  const active =
                    sortConfig.field === option.field &&
                    sortConfig.direction === option.direction;

                  return (
                    <li key={`${option.field}-${option.direction}`}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          handleSortSelect(option.field, option.direction)
                        }
                        className={cn(
                          "border-border text-body-sm hover:bg-accent ease-standard flex h-11 w-full cursor-pointer items-center justify-between border-b transition-colors duration-(--animate-duration-fast)",
                          active
                            ? "text-foreground font-semibold"
                            : "text-ink-body",
                        )}
                      >
                        {option.label}
                        {active && (
                          <Check
                            className="text-primary size-4"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>

          <div className="border-border flex gap-2 border-t p-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClearFilters}
            >
              Reset
            </Button>
            <DrawerClose
              render={
                <Button className="flex-1">
                  Show {filteredAndSortedTransactions.length} results
                </Button>
              }
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Delete confirmation ---------- */}
      <AlertDialog
        open={pendingIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setPendingIds([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash className="text-destructive" aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {pendingIds.length}{" "}
              {pendingIds.length === 1 ? "transaction" : "transactions"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The account balance moves back with them. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortButton({ field, sortConfig, onSort, align, children }) {
  const active = sortConfig.field === field;
  const Icon = sortConfig.direction === "asc" ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      aria-label={`Sort by ${children}`}
      className={cn(
        "hover:text-foreground ease-standard flex w-full cursor-pointer items-center gap-1 transition-colors duration-(--animate-duration-fast)",
        align === "right" && "justify-end",
        active && "text-foreground",
      )}
    >
      {children}
      {active && <Icon className="size-4" aria-hidden="true" />}
    </button>
  );
}
