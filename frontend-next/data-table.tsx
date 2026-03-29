"use client";

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 *  DataTable.tsx  v2 — Advanced Shadcn Data Table
 *  ──────────────────────────────────────────────────────────────────
 *
 *  FEATURES OVERVIEW
 *  ─────────────────
 *  Layout & Display
 *    ✦ Responsive layout — full horizontal scroll on mobile
 *    ✦ Sticky header & optional sticky first column
 *    ✦ Zebra striping, hover highlight, selected-row highlight
 *    ✦ New-row pulse highlight (newItemId)
 *    ✦ Animated row entrance via motion/react (layout="position")
 *    ✦ Dense / comfortable / spacious row density toggle
 *    ✦ Column visibility toggle (persisted via AuthProvider preference)
 *    ✦ Column pinning  (pin left / right / unpin per column)
 *    ✦ Column resizing (drag handle on header)
 *
 *  Search & Filtering
 *    ✦ Global fuzzy search across configurable fields (client or server)
 *    ✦ Live highlight of matched text via SearchHighlightContext
 *    ✦ Per-column filter dropdowns (Autocomplete or plain Select)
 *    ✦ Active-filter chips with individual clear + "clear all"
 *    ✦ Debounced server-side search callback (400 ms)
 *    ✦ resetFilterKey — auto-clears a child filter when a parent changes
 *
 *  Sorting
 *    ✦ Client-side multi-column sort (click header)
 *    ✦ Server-side sort (manualSorting + onSortingChange)
 *    ✦ Sort indicator animations (slide-in chevrons)
 *
 *  Pagination
 *    ✦ Client-side and server-side pagination (manualPagination)
 *    ✦ Rows-per-page selector (10 / 25 / 50 / 100)
 *    ✦ Smart page number list with ellipsis
 *    ✦ Page-jump dropdown (click "…")
 *    ✦ First / Prev / Next / Last navigation
 *
 *  Row Actions
 *    ✦ Inline edit & delete buttons per row (canRowEdit / canRowDelete)
 *    ✦ Row expansion  (renderExpandedRow prop)
 *    ✦ Row click callback  (onRowClick)
 *    ✦ Drag-to-reorder rows  (enableRowReorder + onRowReorder)
 *
 *  Selection & Bulk Actions
 *    ✦ Checkbox-based multi-row selection
 *    ✦ Select-all (current page) checkbox in header
 *    ✦ Bulk edit button (canBulkEdit + onBulkEdit)
 *    ✦ Bulk delete with AlertDialog confirmation (canBulkDelete + onMultiDelete)
 *    ✦ Custom bulk action slot (bulkActions render prop)
 *
 *  Export
 *    ✦ Export to CSV (visible columns, current filtered data)
 *    ✦ Export to JSON
 *    ✦ Copy to clipboard
 *    ✦ canExport flag to hide/show
 *
 *  Toolbar
 *    ✦ Optional title + description
 *    ✦ "Add" action button (toggleAction + actionText)
 *    ✦ View-settings panel  (density, column toggle, column pin, reset)
 *    ✦ Refresh button (onRefresh)
 *    ✦ fullscreen toggle
 *
 *  Loading & Empty States
 *    ✦ isLoading → animated skeleton rows
 *    ✦ Configurable empty state (emptyState render prop)
 *
 * ──────────────────────────────────────────────────────────────────
 *
 *  DEPENDENCIES
 *  ────────────
 *    npx shadcn@latest add button input label select checkbox
 *      dropdown-menu alert-dialog popover scroll-area separator
 *      badge tooltip
 *    npm install @tanstack/react-table motion lucide-react
 *
 * ═══════════════════════════════════════════════════════════════════
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizingState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    Row,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// ── Shadcn UI ─────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";

// ── Icons ─────────────────────────────────────────────────────────
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowUpDownIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronFirstIcon,
    ChevronLastIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    CircleXIcon,
    Clipboard,
    ClipboardCheckIcon,
    Columns3Icon,
    Download,
    FileJson2Icon,
    FileSpreadsheetIcon,
    FilterXIcon,
    GripVerticalIcon,
    Loader2,
    MaximizeIcon,
    MinimizeIcon,
    PencilIcon,
    PinIcon,
    PinOffIcon,
    PlusIcon,
    RefreshCwIcon,
    RowsIcon,
    SearchIcon,
    Settings2Icon,
    TrashIcon,
    XIcon,
} from "lucide-react";

// ── Auth (optional — remove if not using AuthProvider) ────────────
// import { useAuth } from "@/components/providers/auth-provider";

// ═══════════════════════════════════════════════════════════════════
//  SEARCH HIGHLIGHT CONTEXT
// ═══════════════════════════════════════════════════════════════════

const SearchHighlightContext = createContext<string>("");
export const useSearchHighlight = () => useContext(SearchHighlightContext);

/**
 * Wraps text with <mark> elements for matched search substrings.
 * Use inside column cell renderers to get live search highlighting.
 */
export function HighlightText({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const search = useSearchHighlight();
    if (!search || !text) return <span className={className}>{text}</span>;

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5 text-foreground"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC TYPES
// ═══════════════════════════════════════════════════════════════════

export interface DataTableRow {
    id: string;
}

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
    /** Render as autocomplete (default) or plain select */
    variant?: "autocomplete" | "select";
}

/** Row density options */
export type RowDensity = "compact" | "default" | "comfortable";

export interface DataTableProps<TData extends DataTableRow> {
    // ── Core ──────────────────────────────────────────────────────
    /** Column definitions (TanStack ColumnDef array) */
    columns: ColumnDef<TData>[];
    /** Row data */
    data: TData[];
    /** Optional table title shown in toolbar */
    title?: string;
    /** Optional subtitle / description below title */
    description?: string;

    // ── Initial state ─────────────────────────────────────────────
    /** Pre-sorted columns on mount */
    sortingColumns?: SortingState;
    /** Row ID to highlight as "new" on mount */
    newItemId?: string;
    /** Stable key used to persist column visibility (recommended) */
    tableId?: string;

    // ── Toolbar actions ───────────────────────────────────────────
    /** Fires when the "Add" button is clicked */
    toggleAction?: () => void;
    /** Label for the Add button (default: "Add") */
    actionText?: string;
    /** Fires when the refresh button is clicked */
    onRefresh?: () => void;

    // ── Row actions ───────────────────────────────────────────────
    /** Edit callback per row */
    onRowEdit?: (item: TData) => void;
    /** Delete callback per row */
    onRowDelete?: (item: TData) => void;
    /** Row click callback (fires when any cell is clicked, not a button) */
    onRowClick?: (item: TData) => void;
    /**
     * Render expanded content below a row.
     * When provided, rows get a chevron expander in column[0].
     */
    renderExpandedRow?: (item: TData) => React.ReactNode;

    // ── Drag-to-reorder ───────────────────────────────────────────
    /** Enable drag-to-reorder rows */
    enableRowReorder?: boolean;
    /** Fires with the new ordered data array after a drag */
    onRowReorder?: (newData: TData[]) => void;

    // ── Bulk / multi-select actions ───────────────────────────────
    /** Called with selected IDs when bulk-delete is confirmed */
    onMultiDelete?: (ids: string[]) => void;
    /** Called with selected rows when bulk-edit is clicked */
    onBulkEdit?: (items: TData[]) => void;
    /**
     * Custom bulk action slot — receives selected rows, clear-fn.
     * Rendered to the right of built-in bulk buttons.
     */
    bulkActions?: (
        selected: TData[],
        clearSelection: () => void
    ) => React.ReactNode;

    // ── Search & filter ───────────────────────────────────────────
    /** Fields available for the global search box */
    searchFields?: { key: string; label: string }[];
    /** Filter bar configs (each becomes a dropdown) */
    filters?: FilterConfig[];
    /** Fired when any filter dropdown changes */
    onFilterChange?: (key: string, value: string) => void;
    /**
     * When this key changes, any filter whose key is "employeeId" is reset.
     * Useful for cascading department → employee relationships.
     */
    resetFilterKey?: string;

    // ── Permission flags ──────────────────────────────────────────
    canBulkEdit?: boolean;
    canBulkDelete?: boolean;
    canRowEdit?: boolean;
    canRowDelete?: boolean;
    /** Show export (CSV / JSON / copy) buttons (default: true) */
    canExport?: boolean;

    // ── Server-side ───────────────────────────────────────────────
    /** Pass true to disable client-side pagination */
    manualPagination?: boolean;
    /** Total row count for server-side pagination */
    rowCount?: number;
    /** Total page count for server-side pagination */
    pageCount?: number;
    /** Fires on page/pageSize change in server-side mode */
    onPaginationChange?: (pagination: PaginationState) => void;
    /** Pass true to disable client-side sorting */
    manualSorting?: boolean;
    /** Fires on sort change in server-side mode */
    onSortingChange?: (sorting: SortingState) => void;
    /** Pass true to disable client-side filtering */
    manualFiltering?: boolean;
    /** Fires (debounced 400 ms) on search change in server-side mode */
    onSearchChange?: (search: string) => void;

    // ── Display ───────────────────────────────────────────────────
    /** Show loading skeleton rows instead of data */
    isLoading?: boolean;
    /** Initial row density */
    defaultDensity?: RowDensity;
    /**
     * Custom empty state.
     * If omitted, a default "No results" message is shown.
     */
    emptyState?: React.ReactNode;
    /** Rows per page options (default: [10, 25, 50, 100]) */
    pageSizeOptions?: number[];
    /** Default page size (default: 50) */
    defaultPageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════

const DENSITY_CLASS: Record<RowDensity, string> = {
    compact: "py-1",
    default: "py-3",
    comfortable: "py-5",
};

const DENSITY_LABEL: Record<RowDensity, string> = {
    compact: "Compact",
    default: "Default",
    comfortable: "Comfortable",
};

/** Compute visible page numbers with at-most-2 ellipsis slots. */
function getPageNumbers(
    currentPage: number,
    totalPages: number
): (number | "...")[] {
    const pages: (number | "...")[] = [];
    const start = Math.max(1, currentPage + 1 - 2);
    const end = Math.min(totalPages, currentPage + 1 + 2);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (end < totalPages) pages.push(totalPages);

    return pages;
}

/** Convert table rows to CSV string */
function rowsToCsv<TData extends DataTableRow>(
    rows: Row<TData>[],
    visibleColumnIds: string[]
): string {
    const header = visibleColumnIds.join(",");
    const body = rows.map((row) =>
        visibleColumnIds
            .map((colId) => {
                const v = row.getValue(colId);
                const str = v == null ? "" : String(v);
                return str.includes(",") || str.includes('"') || str.includes("\n")
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            })
            .join(",")
    );
    return [header, ...body].join("\n");
}

/** Trigger a file download in the browser */
function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE JUMP DROPDOWN
// ═══════════════════════════════════════════════════════════════════

function PageJumpDropdown({
    totalPages,
    onSelect,
}: {
    totalPages: number;
    onSelect: (page: number) => void;
}) {
    const [search, setSearch] = useState("");
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p.toString().includes(search)
    );

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-muted-foreground hover:text-primary"
                    />
                }
            >
                …
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
                <Input
                    name="page-jump-search"
                    placeholder="Go to page…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-2 h-8"
                />
                <ScrollArea className="h-40">
                    {pages.map((page) => (
                        <Button
                            key={page}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onSelect(page)}
                        >
                            Page {page}
                        </Button>
                    ))}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  SKELETON ROWS
// ═══════════════════════════════════════════════════════════════════

function SkeletonRows({
    columnCount,
    rowCount = 6,
    density,
}: {
    columnCount: number;
    rowCount?: number;
    density: RowDensity;
}) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, i) => (
                <tr key={i} className={cn("border-b border-border/30", i % 2 !== 0 && "bg-muted/20")}>
                    {Array.from({ length: columnCount }).map((_, j) => (
                        <td key={j} className={cn("px-4", DENSITY_CLASS[density])}>
                            <div
                                className={cn(
                                    "h-4 rounded-md bg-muted animate-pulse",
                                    j === 0 ? "w-6 h-6 rounded-full" : j === 1 ? "w-3/4" : "w-1/2"
                                )}
                                style={{ animationDelay: `${(i * columnCount + j) * 30}ms` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  ACTIVE FILTER CHIPS
// ═══════════════════════════════════════════════════════════════════

function ActiveFilterChips({
    activeFilters,
    filters,
    onClear,
    onClearAll,
}: {
    activeFilters: Record<string, string>;
    filters: FilterConfig[];
    onClear: (key: string) => void;
    onClearAll: () => void;
}) {
    const active = Object.entries(activeFilters).filter(
        ([, v]) => v && v !== "all"
    );
    if (!active.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
                Filters:
            </span>
            {active.map(([key, value]) => {
                const config = filters.find((f) => f.key === key);
                const label =
                    config?.options.find((o) => o.value === value)?.label ?? value;
                return (
                    <Badge
                        key={key}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs font-normal"
                    >
                        <span className="text-muted-foreground">{config?.label}:</span>{" "}
                        {label}
                        <button
                            type="button"
                            className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                            onClick={() => onClear(key)}
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                );
            })}
            {active.length > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={onClearAll}
                >
                    <FilterXIcon className="mr-1 h-3 w-3" />
                    Clear all
                </Button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  VIEW SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════

function ViewSettingsPanel<TData extends DataTableRow>({
    table,
    density,
    onDensityChange,
}: {
    table: ReturnType<typeof useReactTable<TData>>;
    density: RowDensity;
    onDensityChange: (d: RowDensity) => void;
}) {
    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-1.5" />
                }
            >
                <Settings2Icon className="h-3.5 w-3.5 opacity-60" />
                View
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
                {/* Density */}
                <div className="mb-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Row Density
                    </p>
                    <div className="flex gap-1">
                        {(["compact", "default", "comfortable"] as RowDensity[]).map(
                            (d) => (
                                <Button
                                    key={d}
                                    size="sm"
                                    variant={density === d ? "default" : "outline"}
                                    className="flex-1 text-xs h-7"
                                    onClick={() => onDensityChange(d)}
                                >
                                    {DENSITY_LABEL[d]}
                                </Button>
                            )
                        )}
                    </div>
                </div>

                <Separator className="my-2" />

                {/* Column visibility */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Columns
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => table.resetColumnVisibility()}
                        >
                            Reset
                        </Button>
                    </div>
                    <ScrollArea className="max-h-56">
                        <div className="flex flex-col gap-1.5">
                            {table
                                .getAllColumns()
                                .filter((col) => col.getCanHide())
                                .map((column) => (
                                    <label
                                        key={column.id}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(v) => column.toggleVisibility(!!v)}
                                            className="h-3.5 w-3.5"
                                        />
                                        <span className="capitalize">{column.id}</span>

                                        {/* Pin toggle */}
                                        <button
                                            type="button"
                                            className="ml-auto text-muted-foreground hover:text-foreground"
                                            title={
                                                column.getIsPinned()
                                                    ? "Unpin column"
                                                    : "Pin column left"
                                            }
                                            onClick={(e) => {
                                                e.preventDefault();
                                                column.pin(
                                                    column.getIsPinned() === "left" ? false : "left"
                                                );
                                            }}
                                        >
                                            {column.getIsPinned() ? (
                                                <PinOffIcon className="h-3.5 w-3.5" />
                                            ) : (
                                                <PinIcon className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </label>
                                ))}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORT MENU
// ═══════════════════════════════════════════════════════════════════

function ExportMenu<TData extends DataTableRow>({
    table,
    title,
}: {
    table: ReturnType<typeof useReactTable<TData>>;
    title?: string;
}) {
    const [copied, setCopied] = useState(false);

    const visibleCols = table
        .getVisibleFlatColumns()
        .filter((c) => c.id !== "select" && c.id !== "actions" && c.id !== "expander")
        .map((c) => c.id);

    const rows = table.getFilteredRowModel().rows;

    const handleCsv = () => {
        const csv = rowsToCsv(rows, visibleCols);
        downloadFile(csv, `${title ?? "export"}.csv`, "text/csv");
    };

    const handleJson = () => {
        const json = JSON.stringify(
            rows.map((r) => r.original),
            null,
            2
        );
        downloadFile(json, `${title ?? "export"}.json`, "application/json");
    };

    const handleCopy = async () => {
        const csv = rowsToCsv(rows, visibleCols);
        await navigator.clipboard.writeText(csv);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-1.5" />
                }
            >
                <Download className="h-3.5 w-3.5 opacity-60" />
                Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCsv}>
                    <FileSpreadsheetIcon className="mr-2 h-4 w-4 text-green-600" />
                    Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleJson}>
                    <FileJson2Icon className="mr-2 h-4 w-4 text-blue-500" />
                    Download JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopy}>
                    {copied ? (
                        <ClipboardCheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                        <Clipboard className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy to clipboard"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN DATA TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function DataTable<TData extends DataTableRow>({
    columns,
    data: initialData,
    sortingColumns = [],
    toggleAction,
    actionText = "Add",
    title,
    description,
    newItemId,
    onMultiDelete,
    onBulkEdit,
    onRowEdit,
    onRowDelete,
    onRowClick,
    renderExpandedRow,
    enableRowReorder = false,
    onRowReorder,
    bulkActions,
    searchFields,
    filters,
    onFilterChange,
    resetFilterKey,
    tableId,
    canBulkEdit = true,
    canBulkDelete = true,
    canRowEdit = true,
    canRowDelete = true,
    canExport = true,
    manualPagination = false,
    rowCount,
    pageCount,
    onPaginationChange,
    manualSorting = false,
    onSortingChange: onSortingChangeProp,
    manualFiltering = false,
    onSearchChange,
    isLoading = false,
    defaultDensity = "default",
    emptyState,
    pageSizeOptions = [10, 25, 50, 100],
    defaultPageSize = 50,
    onRefresh,
}: DataTableProps<TData>) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── State ────────────────────────────────────────────────────
    const [data, setData] = useState<TData[]>(initialData);
    const [sorting, setSorting] = useState<SortingState>(sortingColumns);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [density, setDensity] = useState<RowDensity>(defaultDensity);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(
        newItemId ?? null
    );

    // Drag-to-reorder
    const dragRowIndex = useRef<number | null>(null);

    // Debounced server-side search
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Auth preference persistence (Disabled) ───────────────────
    // const { getPreference, updatePreference } = useAuth();
    const storageKey = tableId ? `table-column-visibility-${tableId}` : null;
    const isInitialMount = useRef(true);

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        () => ({}) // storageKey ? getPreference(storageKey) ?? {} : {}
    );

    // ── Derived ──────────────────────────────────────────────────
    const globalFilterValue = JSON.stringify({ search, activeFilters });

    // ── Column definitions with injected select + expander ───────
    const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
        const cols: ColumnDef<TData>[] = [];

        // Select checkbox
        if (onMultiDelete || onBulkEdit || bulkActions) {
            cols.push({
                id: "select",
                size: 40,
                enableHiding: false,
                enableSorting: false,
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
                        }
                        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                        aria-label="Select all"
                        className="translate-y-px"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(!!v)}
                        aria-label="Select row"
                        className="translate-y-px"
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
            });
        }

        // Expand chevron
        if (renderExpandedRow) {
            cols.push({
                id: "expander",
                size: 40,
                enableHiding: false,
                enableSorting: false,
                header: () => null,
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            row.toggleExpanded();
                        }}
                    >
                        <ChevronRightIcon
                            className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                row.getIsExpanded() && "rotate-90"
                            )}
                        />
                    </Button>
                ),
            });
        }

        // Drag handle
        if (enableRowReorder) {
            cols.push({
                id: "drag",
                size: 36,
                enableHiding: false,
                enableSorting: false,
                header: () => null,
                cell: () => (
                    <GripVerticalIcon
                        className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing"
                    />
                ),
            });
        }

        cols.push(...columns);

        // Actions
        if (onRowEdit || onRowDelete) {
            cols.push({
                id: "actions",
                size: 80,
                enableHiding: false,
                enableSorting: false,
                header: () => (
                    <span className="sr-only">Actions</span>
                ),
                cell: ({ row }) => (
                    <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {onRowEdit && canRowEdit && (
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => onRowEdit(row.original)}
                                        >
                                            <PencilIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Edit</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {onRowDelete && canRowDelete && (
                            <AlertDialog>
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Delete</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this row?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => onRowDelete(row.original)}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                ),
            });
        }

        return cols;
    }, [
        columns, onMultiDelete, onBulkEdit, bulkActions,
        renderExpandedRow, enableRowReorder,
        onRowEdit, onRowDelete, canRowEdit, canRowDelete,
    ]);

    // ── Table instance ───────────────────────────────────────────
    const table = useReactTable<TData>({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        enableRowSelection: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        enableColumnPinning: true,
        manualPagination,
        manualSorting,
        manualFiltering,
        rowCount,
        pageCount,
        enableSortingRemoval: false,
        globalFilterFn: (row) => {
            // Search filter (OR across searchFields)
            if (search && searchFields?.length) {
                const lower = search.toLowerCase();
                const hit = searchFields.some((f) =>
                    String(row.getValue(f.key) ?? "").toLowerCase().includes(lower)
                );
                if (!hit) return false;
            }

            // Active filters (AND logic)
            for (const [key, val] of Object.entries(activeFilters)) {
                if (!val || val === "all") continue;
                let rowVal: unknown;
                try { rowVal = row.getValue(key); } catch {
                    rowVal = (row.original as Record<string, unknown>)[key];
                }
                const rowStr = rowVal != null ? String(rowVal).trim() : "";
                const filtStr = String(val).trim();
                const isId = key.toLowerCase().endsWith("id");
                if (isId ? rowStr !== filtStr : rowStr.toLowerCase() !== filtStr.toLowerCase())
                    return false;
            }

            return true;
        },
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
            globalFilter: globalFilterValue,
        },
        onSortingChange: (updater) => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            setSorting(next);
            onSortingChangeProp?.(next);
        },
        onPaginationChange: (updater) => {
            const next =
                typeof updater === "function" ? updater(pagination) : updater;
            setPagination(next);
            onPaginationChange?.(next);
        },
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
    });

    // ── Effects ──────────────────────────────────────────────────

    useEffect(() => { setData(initialData); }, [initialData]);

    // Highlight new row
    useEffect(() => {
        if (!newItemId) return;
        setHighlightedId(newItemId);
        const t = setTimeout(() => setHighlightedId(null), 10_000);
        return () => clearTimeout(t);
    }, [newItemId]);

    /* 
    // Persist column visibility (Disabled)
    useEffect(() => {
        if (!storageKey) return;
        const saved = getPreference(storageKey);
        if (saved) setColumnVisibility(saved);
        isInitialMount.current = false;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (!storageKey) return;
        updatePreference(storageKey, columnVisibility);
    }, [columnVisibility, storageKey, updatePreference]);
    */

    // Cascading filter reset
    const prevResetKey = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (
            resetFilterKey !== undefined &&
            prevResetKey.current !== undefined &&
            prevResetKey.current !== resetFilterKey
        ) {
            setActiveFilters((prev) => {
                const next = { ...prev };
                const empFilter = filters?.find((f) => f.key === "employeeId");
                if (empFilter && next[empFilter.key]) delete next[empFilter.key];
                return next;
            });
        }
        prevResetKey.current = resetFilterKey;
    }, [resetFilterKey, filters]);

    // Fullscreen toggle
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        if (isFullscreen) {
            el.requestFullscreen?.();
        } else {
            if (document.fullscreenElement) document.exitFullscreen?.();
        }
    }, [isFullscreen]);

    // ── Handlers ─────────────────────────────────────────────────

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (onSearchChange) {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = setTimeout(() => onSearchChange(value), 400);
        }
    }, [onSearchChange]);

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            setActiveFilters((prev) => ({ ...prev, [key]: value }));
            onFilterChange?.(key, value);
        },
        [onFilterChange]
    );

    const handleClearFilter = useCallback((key: string) => {
        setActiveFilters((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        onFilterChange?.(key, "all");
    }, [onFilterChange]);

    const handleClearAllFilters = useCallback(() => {
        setActiveFilters({});
        filters?.forEach((f) => onFilterChange?.(f.key, "all"));
    }, [filters, onFilterChange]);

    const handleBulkDelete = useCallback(() => {
        const selected = table.getSelectedRowModel().rows;
        const ids = selected.map((r) => r.original.id);
        onMultiDelete?.(ids);
        setData((prev) =>
            prev.filter((item) => !ids.includes(item.id))
        );
        table.resetRowSelection();
    }, [table, onMultiDelete]);

    // Drag-to-reorder handlers
    const handleDragStart = useCallback(
        (_: React.DragEvent, rowIndex: number) => {
            dragRowIndex.current = rowIndex;
        },
        []
    );

    const handleDrop = useCallback(
        (_: React.DragEvent, targetIndex: number) => {
            if (dragRowIndex.current == null || dragRowIndex.current === targetIndex)
                return;
            const newData = [...data];
            const [moved] = newData.splice(dragRowIndex.current, 1);
            newData.splice(targetIndex, 0, moved);
            setData(newData);
            onRowReorder?.(newData);
            dragRowIndex.current = null;
        },
        [data, onRowReorder]
    );

    // ── Pagination info ──────────────────────────────────────────
    const paginationState = table.getState().pagination;
    const totalRows = table.getRowCount();
    const pageStart = paginationState.pageIndex * paginationState.pageSize + 1;
    const pageEnd = Math.min(
        paginationState.pageIndex * paginationState.pageSize +
        paginationState.pageSize,
        totalRows
    );

    const selectedRows = table.getSelectedRowModel().rows;
    const hasSelection = selectedRows.length > 0;

    // ═══════════════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <SearchHighlightContext.Provider value={search}>
            <div
                ref={containerRef}
                className={cn(
                    "flex flex-col gap-3 w-full",
                    isFullscreen && "bg-background p-6 overflow-auto"
                )}
            >
                {/* ── TOOLBAR ─────────────────────────────────────────── */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: title + search + filters */}
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        {(title || description) && (
                            <div>
                                {title && (
                                    <h2 className="text-base font-semibold leading-none tracking-tight">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            {!!searchFields?.length && (
                                <div className="relative">
                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id={`${id}-search`}
                                        ref={inputRef}
                                        className="pl-8 pr-8 h-8 w-56 text-sm"
                                        value={search}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        placeholder={`Search ${searchFields.map((f) => f.label).join(", ")}…`}
                                        type="text"
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleSearchChange("")}
                                            aria-label="Clear search"
                                        >
                                            <CircleXIcon className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Filter dropdowns */}
                            {filters?.map((filter) => (
                                <Select
                                    key={filter.key}
                                    value={activeFilters[filter.key] ?? "all"}
                                    onValueChange={(v) => handleFilterChange(filter.key, v)}
                                >
                                    <SelectTrigger className="h-8 w-[160px] text-sm">
                                        <SelectValue
                                            placeholder={`All ${filter.label}`}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All {filter.label}</SelectItem>
                                        {filter.options.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ))}
                        </div>

                        {/* Active filter chips */}
                        {!!filters?.length && (
                            <ActiveFilterChips
                                activeFilters={activeFilters}
                                filters={filters}
                                onClear={handleClearFilter}
                                onClearAll={handleClearAllFilters}
                            />
                        )}
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {/* Bulk action bar */}
                        <AnimatePresence>
                            {hasSelection && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5"
                                >
                                    <span className="text-xs font-medium text-primary">
                                        {selectedRows.length} selected
                                    </span>
                                    <Separator orientation="vertical" className="h-4" />

                                    {onBulkEdit && canBulkEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                            onClick={() =>
                                                onBulkEdit(selectedRows.map((r) => r.original))
                                            }
                                        >
                                            <PencilIcon className="h-3 w-3" />
                                            Edit
                                        </Button>
                                    )}

                                    {onMultiDelete && canBulkDelete && (
                                        <AlertDialog>
                                            <AlertDialogTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 gap-1 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                                                    />
                                                }
                                            >
                                                <TrashIcon className="h-3 w-3" />
                                                Delete
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Delete {selectedRows.length}{" "}
                                                        {selectedRows.length === 1 ? "row" : "rows"}?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. All selected rows will
                                                        be permanently deleted.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={handleBulkDelete}
                                                    >
                                                        Delete {selectedRows.length} rows
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}

                                    {bulkActions?.(
                                        selectedRows.map((r) => r.original),
                                        () => table.resetRowSelection()
                                    )}

                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => table.resetRowSelection()}
                                    >
                                        <XIcon className="h-3.5 w-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Export */}
                        {canExport && (
                            <ExportMenu table={table} title={title} />
                        )}

                        {/* View settings */}
                        <ViewSettingsPanel
                            table={table}
                            density={density}
                            onDensityChange={setDensity}
                        />

                        {/* Refresh */}
                        {onRefresh && (
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={onRefresh}
                                            />
                                        }
                                    >
                                        <RefreshCwIcon className="h-3.5 w-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent>Refresh</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Fullscreen */}
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setIsFullscreen((f) => !f)}
                                        />
                                    }
                                >
                                    {isFullscreen ? (
                                        <MinimizeIcon className="h-3.5 w-3.5" />
                                    ) : (
                                        <MaximizeIcon className="h-3.5 w-3.5" />
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Add */}
                        {toggleAction && (
                            <Button size="sm" onClick={toggleAction} className="gap-1.5">
                                <PlusIcon className="h-3.5 w-3.5 opacity-70" />
                                {actionText}
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── TABLE ───────────────────────────────────────────── */}
                <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                    <div className="w-full overflow-x-auto">
                        <table
                            className="w-full text-sm"
                            style={{ minWidth: table.getTotalSize() }}
                        >
                            <thead className="bg-muted/40 border-b border-border/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className={cn(
                                                    "px-4 h-10 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap select-none relative group",
                                                    header.column.getIsPinned() === "left" &&
                                                    "sticky left-0 z-20 bg-muted/40"
                                                )}
                                                style={{ width: header.getSize() }}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div className="flex items-center gap-1.5">
                                                        {header.column.getCanSort() ? (
                                                            <button
                                                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                                                onClick={header.column.getToggleSortingHandler()}
                                                            >
                                                                {flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                                {{
                                                                    asc: (
                                                                        <ArrowUpIcon className="h-3.5 w-3.5 text-primary" />
                                                                    ),
                                                                    desc: (
                                                                        <ArrowDownIcon className="h-3.5 w-3.5 text-primary" />
                                                                    ),
                                                                }[
                                                                    header.column.getIsSorted() as string
                                                                ] ?? (
                                                                        <ArrowUpDownIcon className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                                    )}
                                                            </button>
                                                        ) : (
                                                            flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                                {/* Column resize handle */}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className={cn(
                                                            "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/40 transition-colors",
                                                            header.column.getIsResizing() && "bg-primary"
                                                        )}
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <SkeletonRows
                                        columnCount={tableColumns.length}
                                        density={density}
                                    />
                                ) : table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row, index) => {
                                        const isNew = row.original.id === highlightedId;
                                        const isExpanded = row.getIsExpanded();

                                        return (
                                            <React.Fragment key={row.id}>
                                                <motion.tr
                                                    layout="position"
                                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                    data-state={row.getIsSelected() ? "selected" : undefined}
                                                    draggable={enableRowReorder}
                                                    onDragStart={
                                                        enableRowReorder
                                                            ? (e) => handleDragStart(e, index)
                                                            : undefined
                                                    }
                                                    onDragOver={
                                                        enableRowReorder
                                                            ? (e) => e.preventDefault()
                                                            : undefined
                                                    }
                                                    onDrop={
                                                        enableRowReorder
                                                            ? (e) => handleDrop(e, index)
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        "border-b border-border/30 transition-colors duration-150",
                                                        index % 2 !== 0 && "bg-muted/20",
                                                        "hover:bg-accent/50",
                                                        row.getIsSelected() && "bg-primary/5 hover:bg-primary/10",
                                                        isNew &&
                                                        "bg-primary/10 ring-inset ring-1 ring-primary/30",
                                                        onRowClick && "cursor-pointer",
                                                        enableRowReorder && "cursor-grab active:cursor-grabbing"
                                                    )}
                                                    onClick={
                                                        onRowClick
                                                            ? () => onRowClick(row.original)
                                                            : undefined
                                                    }
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td
                                                            key={cell.id}
                                                            className={cn(
                                                                "px-4 align-middle",
                                                                DENSITY_CLASS[density],
                                                                cell.column.getIsPinned() === "left" &&
                                                                "sticky left-0 z-10 bg-card/80 backdrop-blur-sm"
                                                            )}
                                                            style={{ width: cell.column.getSize() }}
                                                        >
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    ))}
                                                </motion.tr>

                                                {/* Expanded row */}
                                                {isExpanded && renderExpandedRow && (
                                                    <tr
                                                        key={`${row.id}-expanded`}
                                                        className="bg-muted/10 border-b border-border/30"
                                                    >
                                                        <td
                                                            colSpan={row.getVisibleCells().length}
                                                            className="px-6 py-4"
                                                        >
                                                            {renderExpandedRow(row.original)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={tableColumns.length}
                                            className="h-40 text-center"
                                        >
                                            {emptyState ?? (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <SearchIcon className="h-8 w-8 opacity-20" />
                                                    <p className="text-sm font-medium">No results found</p>
                                                    <p className="text-xs">
                                                        Try adjusting your search or filters
                                                    </p>
                                                    {(search ||
                                                        Object.keys(activeFilters).length > 0) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="mt-1 text-xs"
                                                                onClick={() => {
                                                                    setSearch("");
                                                                    setActiveFilters({});
                                                                }}
                                                            >
                                                                <FilterXIcon className="mr-1.5 h-3.5 w-3.5" />
                                                                Clear filters
                                                            </Button>
                                                        )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── PAGINATION FOOTER ────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Rows per page */}
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor={`${id}-page-size`}
                            className="text-xs text-muted-foreground whitespace-nowrap"
                        >
                            Rows per page
                        </Label>
                        <Select
                            value={String(paginationState.pageSize)}
                            onValueChange={(v) => table.setPageSize(Number(v))}
                        >
                            <SelectTrigger id={`${id}-page-size`} className="h-7 w-[70px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)} className="text-xs">
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Page numbers */}
                    <div className="flex items-center gap-0.5">
                        {getPageNumbers(
                            paginationState.pageIndex,
                            table.getPageCount()
                        ).map((page, idx) =>
                            page === "..." ? (
                                <PageJumpDropdown
                                    key={`ellipsis-${idx}`}
                                    totalPages={table.getPageCount()}
                                    onSelect={(p) => table.setPageIndex(p - 1)}
                                />
                            ) : (
                                <Button
                                    key={`page-${page}`}
                                    size="sm"
                                    variant={
                                        page === paginationState.pageIndex + 1
                                            ? "default"
                                            : "ghost"
                                    }
                                    className="h-7 w-7 p-0 text-xs"
                                    onClick={() => table.setPageIndex((page as number) - 1)}
                                >
                                    {page}
                                </Button>
                            )
                        )}
                    </div>

                    {/* Range info + nav arrows */}
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            <span className="text-foreground font-medium">
                                {totalRows === 0 ? 0 : pageStart}–{pageEnd}
                            </span>{" "}
                            of{" "}
                            <span className="text-foreground font-medium">{totalRows}</span>
                        </p>

                        <Pagination>
                            <PaginationContent className="gap-0.5">
                                {[
                                    {
                                        icon: ChevronFirstIcon,
                                        action: () => table.firstPage(),
                                        disabled: !table.getCanPreviousPage(),
                                        label: "First page",
                                    },
                                    {
                                        icon: ChevronLeftIcon,
                                        action: () => table.previousPage(),
                                        disabled: !table.getCanPreviousPage(),
                                        label: "Previous page",
                                    },
                                    {
                                        icon: ChevronRightIcon,
                                        action: () => table.nextPage(),
                                        disabled: !table.getCanNextPage(),
                                        label: "Next page",
                                    },
                                    {
                                        icon: ChevronLastIcon,
                                        action: () => table.lastPage(),
                                        disabled: !table.getCanNextPage(),
                                        label: "Last page",
                                    },
                                ].map(({ icon: Icon, action, disabled, label }) => (
                                    <PaginationItem key={label}>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            onClick={action}
                                            disabled={disabled}
                                            aria-label={label}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    </PaginationItem>
                                ))}
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </SearchHighlightContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/**
 * ── Example 1: Basic client-side table ─────────────────────────
 *
 * import { ColumnDef } from "@tanstack/react-table";
 * import DataTable, { HighlightText } from "@/components/DataTable";
 *
 * type User = { id: string; name: string; email: string; role: string };
 *
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name",  header: "Name",
 *     cell: ({ getValue }) => <HighlightText text={String(getValue())} /> },
 *   { accessorKey: "email", header: "Email" },
 *   { accessorKey: "role",  header: "Role" },
 * ];
 *
 * <DataTable
 *   tableId="users"
 *   columns={columns}
 *   data={users}
 *   title="Users"
 *   description="Manage your team members"
 *   searchFields={[{ key: "name", label: "name" }, { key: "email", label: "email" }]}
 *   filters={[{
 *     key: "role", label: "Role",
 *     options: [{ value: "admin", label: "Admin" }, { value: "user", label: "User" }],
 *   }]}
 *   toggleAction={() => setOpen(true)}
 *   actionText="Invite user"
 *   onRowEdit={(u) => startEdit(u)}
 *   onRowDelete={(u) => deleteUser(u.id)}
 *   onMultiDelete={(ids) => bulkDelete(ids)}
 *   canExport
 * />
 *
 *
 * ── Example 2: Server-side pagination + sorting ─────────────────
 *
 * <DataTable
 *   tableId="orders"
 *   columns={columns}
 *   data={pageData}
 *   manualPagination
 *   rowCount={totalOrders}
 *   onPaginationChange={({ pageIndex, pageSize }) =>
 *     fetchOrders({ page: pageIndex, limit: pageSize })}
 *   manualSorting
 *   onSortingChange={(s) => setSortParam(s[0])}
 *   manualFiltering
 *   onSearchChange={(q) => setQuery(q)}
 *   isLoading={isFetching}
 * />
 *
 *
 * ── Example 3: Row expansion ────────────────────────────────────
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   renderExpandedRow={(row) => (
 *     <div className="grid grid-cols-3 gap-4 text-sm">
 *       <div><strong>Notes:</strong> {row.notes}</div>
 *       <div><strong>Created:</strong> {row.createdAt}</div>
 *     </div>
 *   )}
 * />
 *
 *
 * ── Example 4: Custom bulk actions ─────────────────────────────
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   bulkActions={(selected, clear) => (
 *     <Button size="sm" variant="ghost" className="h-6 text-xs"
 *       onClick={() => { exportSelected(selected); clear(); }}>
 *       Export selected
 *     </Button>
 *   )}
 * />
 *
 *
 * ── Example 5: Drag-to-reorder rows ────────────────────────────
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   enableRowReorder
 *   onRowReorder={(newData) => saveOrder(newData)}
 * />
 */