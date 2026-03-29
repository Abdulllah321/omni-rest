"use client";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 *  FormGenerator.tsx  v2 — Advanced Shadcn Form Generator
 *  ─────────────────────────────────────────────────────────────
 *  NEW in v2:
 *   • Multi-step wizard  (steps prop)
 *   • Per-field responsive colSpan  { xs, sm, md, lg, xl }
 *   • Step-level validation (only validates fields in current step)
 *   • 3 step indicator styles: "progress" | "tabs" | "sidebar"
 *   • Per-step column override
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * DEPENDENCIES:
 *   npx shadcn@latest add button input label select checkbox switch
 *     textarea popover calendar command badge progress separator
 *   npm install react-hook-form zod @hookform/resolvers date-fns
 */

import * as React from "react";
import {
    useForm,
    FieldValues,
    DefaultValues,
    Path,
    SubmitHandler,
    Control,
    ControllerRenderProps,
    UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodTypeAny } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ── Shadcn primitives ─────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Form, FormControl, FormDescription,
    FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Label, LabelRequired, LabelOptional } from "@/components/ui/label";



// ── Icons ─────────────────────────────────────────────────────
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Loader2,
    X,
    Eye,
    EyeOff,
    ChevronRight,
    ChevronLeft,
    CheckCheck,
    Circle,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Responsive column span inside a 12-column grid.
 *
 * Example: { xs: 12, sm: 6, lg: 4 }
 *   → full width on mobile, half on ≥sm, one-third on ≥lg
 *
 * If colSpan is omitted the field fills one "column slot" based
 * on the form/step `columns` prop (same as v1 behaviour).
 */
export interface ColSpan {
    /** < 640px  (mobile-first, always 12 if unset) */
    xs?: ColVal;
    /** ≥ 640px  sm breakpoint */
    sm?: ColVal;
    /** ≥ 768px  md breakpoint */
    md?: ColVal;
    /** ≥ 1024px lg breakpoint */
    lg?: ColVal;
    /** ≥ 1280px xl breakpoint */
    xl?: ColVal;
}
type ColVal = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "full";

export interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
    badge?: string;
}

export interface DateRange { from?: Date; to?: Date; }

// ── Base field ────────────────────────────────────────────────
interface BaseField<T extends FieldValues = FieldValues> {
    /** Must match a key in your Zod schema */
    name: Path<T>;
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    wrapperClassName?: string;
    required?: boolean;
    /** Optional icon to display at the start of the input */
    startIcon?: React.ReactNode;
    /**
     * Responsive column span within a 12-col grid.
     * Overrides the form/step `columns` prop for this field.
     */
    colSpan?: ColSpan;
}

// ── Concrete field types ──────────────────────────────────────
interface TextField<T extends FieldValues> extends BaseField<T> { type: "text" | "email" | "tel" | "url" | "number" | "hidden"; }
interface PasswordField<T extends FieldValues> extends BaseField<T> { type: "password"; showToggle?: boolean; }
interface TextareaField<T extends FieldValues> extends BaseField<T> { type: "textarea"; rows?: number; autoResize?: boolean; }
interface SelectField<T extends FieldValues> extends BaseField<T> { type: "select"; options: SelectOption[]; }
interface SearchableSelectField<T extends FieldValues> extends BaseField<T> { type: "searchable-select"; options: SelectOption[]; searchPlaceholder?: string; emptyMessage?: string; }
interface MultiSelectField<T extends FieldValues> extends BaseField<T> { type: "multi-select"; options: SelectOption[]; searchPlaceholder?: string; emptyMessage?: string; maxSelected?: number; }
interface DateField<T extends FieldValues> extends BaseField<T> { type: "date"; dateFormat?: string; fromDate?: Date; toDate?: Date; }
interface DateRangeField<T extends FieldValues> extends BaseField<T> { type: "date-range"; dateFormat?: string; fromDate?: Date; toDate?: Date; }
interface CheckboxField<T extends FieldValues> extends BaseField<T> { type: "checkbox"; }
interface CheckboxGroupField<T extends FieldValues> extends BaseField<T> { type: "checkbox-group"; options: SelectOption[]; direction?: "horizontal" | "vertical"; }
interface SwitchField<T extends FieldValues> extends BaseField<T> { type: "switch"; }
interface RadioGroupField<T extends FieldValues> extends BaseField<T> { type: "radio-group"; options: SelectOption[]; direction?: "horizontal" | "vertical"; }
interface FileField<T extends FieldValues> extends BaseField<T> { type: "file"; accept?: string; multiple?: boolean; }
interface ColorField<T extends FieldValues> extends BaseField<T> { type: "color"; }

export type FormFieldConfig<T extends FieldValues = FieldValues> =
    | TextField<T> | PasswordField<T> | TextareaField<T>
    | SelectField<T> | SearchableSelectField<T> | MultiSelectField<T>
    | DateField<T> | DateRangeField<T>
    | CheckboxField<T> | CheckboxGroupField<T>
    | SwitchField<T> | RadioGroupField<T>
    | FileField<T> | ColorField<T>;

// ── Step definition ───────────────────────────────────────────
export interface FormStep<T extends FieldValues = FieldValues> {
    /** Displayed in the step indicator */
    title: string;
    /** Optional subtitle */
    description?: string;
    /** Optional icon — any React node */
    icon?: React.ReactNode;
    /** Field names that belong to this step */
    fields: Path<T>[];
    /**
     * Column count override for this specific step.
     * Uses the form-level `columns` prop when omitted.
     */
    columns?: 1 | 2 | 3 | 4 | 6 | 12;
}

// ── FormGenerator props ───────────────────────────────────────
export interface FormGeneratorProps<T extends FieldValues = FieldValues> {
    /** All field configurations */
    fields: FormFieldConfig<T>[];
    /** Zod schema covering every field */
    schema: ZodTypeAny;
    defaultValues?: DefaultValues<T>;
    onSubmit: SubmitHandler<T>;
    onReset?: () => void;
    submitLabel?: string;
    showReset?: boolean;
    resetLabel?: string;
    disabled?: boolean;
    isLoading?: boolean;
    /**
     * Default number of equal columns (fallback when no colSpan).
     * The grid is always 12 units wide internally.
     * Default: 1
     */
    columns?: 1 | 2 | 3 | 4 | 6 | 12;
    className?: string;
    footer?: React.ReactNode;
    hideSubmit?: boolean;

    // ── Multi-step ─────────────────────────────────────────────
    /**
     * Provide steps to enable the multi-step wizard mode.
     * Each step declares which field names it owns.
     */
    steps?: FormStep<T>[];
    /** Step indicator style. Default: "progress" */
    stepIndicator?: "tabs" | "progress" | "sidebar";
    nextLabel?: string;
    prevLabel?: string;
    /** Fires whenever the active step changes */
    onStepChange?: (step: number, total: number) => void;
}

// ═══════════════════════════════════════════════════════════════
//  COL-SPAN HELPERS
// ═══════════════════════════════════════════════════════════════

const v = (val: ColVal) => (val === "full" ? "12" : String(val));

const colSpanClass = (cs: ColSpan): string =>
    [
        cs.xs !== undefined && `col-span-${v(cs.xs)}`,
        cs.sm !== undefined && `sm:col-span-${v(cs.sm)}`,
        cs.md !== undefined && `md:col-span-${v(cs.md)}`,
        cs.lg !== undefined && `lg:col-span-${v(cs.lg)}`,
        cs.xl !== undefined && `xl:col-span-${v(cs.xl)}`,
    ]
        .filter(Boolean)
        .join(" ");

/** Fallback span when `columns` prop is used (no explicit colSpan) */
const spanFromColumns = (cols: number): string => {
    const per = 12 / cols;
    // Always full on xs, then split from sm upward
    return cols === 1 ? "col-span-12" : `col-span-12 sm:col-span-${per}`;
};

/** Converts camelCase/snake_case/kebab-case to Title Case */
const humanize = (str: string) => {
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .replace(/^\w/, c => c.toUpperCase())
        .trim();
};


// ═══════════════════════════════════════════════════════════════
//  INDIVIDUAL FIELD RENDERERS
// ═══════════════════════════════════════════════════════════════

// ── Password ──────────────────────────────────────────────────
function PasswordInput<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: PasswordField<T>; disabled?: boolean }) {
    const [show, setShow] = React.useState(false);
    return (
        <div className="relative">
            <Input {...field} value={field.value ?? ""} type={show ? "text" : "password"} placeholder={config.placeholder}
                disabled={disabled || config.disabled} className={cn("pr-10", config.startIcon && "pl-8", config.className)} />
            {config.showToggle !== false && (
                <Button type="button" variant="ghost" size="icon" tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShow(s => !s)}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            )}
        </div>
    );
}

// ── Auto-resize Textarea ──────────────────────────────────────
function AutoResizeTextarea<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: TextareaField<T>; disabled?: boolean }) {
    const ref = React.useRef<HTMLTextAreaElement>(null);
    const resize = React.useCallback(() => {
        const el = ref.current; if (!el) return;
        el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`;
    }, []);
    React.useEffect(() => { resize(); }, [field.value, resize]);
    return (
        <Textarea {...field} value={field.value ?? ""} ref={ref} rows={config.rows ?? 3} placeholder={config.placeholder}
            disabled={disabled || config.disabled}
            className={cn("resize-none overflow-hidden", config.className)} onInput={resize} />
    );
}

// ── Searchable Select ─────────────────────────────────────────
function SearchableSelect<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: SearchableSelectField<T>; disabled?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const selected = config.options.find(o => o.value === field.value);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open}
                    disabled={disabled || config.disabled}
                    className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground", config.className)}>
                    {selected?.label ?? config.placeholder ?? "Select option…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={config.searchPlaceholder ?? "Search…"} />
                    <CommandList>
                        <CommandEmpty>{config.emptyMessage ?? "No results found."}</CommandEmpty>
                        <CommandGroup>
                            {config.options.map(opt => (
                                <CommandItem key={opt.value} value={opt.value} disabled={opt.disabled}
                                    onSelect={val => { field.onChange(val === field.value ? "" : val); setOpen(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", field.value === opt.value ? "opacity-100" : "opacity-0")} />
                                    {opt.label}
                                    {opt.badge && <Badge variant="secondary" className="ml-auto text-xs">{opt.badge}</Badge>}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ── Multi-Select ──────────────────────────────────────────────
function MultiSelect<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: MultiSelectField<T>; disabled?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const selected: string[] = Array.isArray(field.value) ? field.value : [];
    const toggle = (val: string) => {
        if (selected.includes(val)) field.onChange(selected.filter(v => v !== val));
        else {
            if (config.maxSelected && selected.length >= config.maxSelected) return;
            field.onChange([...selected, val]);
        }
    };
    return (
        <div className="flex flex-col gap-1.5">
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map(val => (
                        <Badge key={val} variant="secondary" className="gap-1 pr-1">
                            {config.options.find(o => o.value === val)?.label ?? val}
                            <button type="button" onClick={() => toggle(val)} disabled={disabled || config.disabled}
                                className="rounded-sm opacity-70 hover:opacity-100">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" disabled={disabled || config.disabled}
                        className={cn("w-full justify-between font-normal", selected.length === 0 && "text-muted-foreground")}>
                        {selected.length === 0 ? config.placeholder ?? "Select options…" : `${selected.length} selected`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder={config.searchPlaceholder ?? "Search…"} />
                        <CommandList>
                            <CommandEmpty>{config.emptyMessage ?? "No results found."}</CommandEmpty>
                            <CommandGroup>
                                {config.options.map(opt => {
                                    const isSel = selected.includes(opt.value);
                                    const maxed = !!config.maxSelected && selected.length >= config.maxSelected && !isSel;
                                    return (
                                        <CommandItem key={opt.value} value={opt.value}
                                            disabled={opt.disabled || maxed} onSelect={() => toggle(opt.value)}>
                                            <Check className={cn("mr-2 h-4 w-4", isSel ? "opacity-100" : "opacity-0")} />
                                            {opt.label}
                                            {opt.badge && <Badge variant="secondary" className="ml-auto text-xs">{opt.badge}</Badge>}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {config.maxSelected && <p className="text-xs text-muted-foreground">Max {config.maxSelected} selections</p>}
        </div>
    );
}

// ── Date Picker ───────────────────────────────────────────────
function DatePicker<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: DateField<T>; disabled?: boolean }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled || config.disabled}
                    className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", config.className)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, config.dateFormat ?? "PPP") : config.placeholder ?? "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                    fromDate={config.fromDate} toDate={config.toDate} initialFocus />
            </PopoverContent>
        </Popover>
    );
}

// ── Date Range ────────────────────────────────────────────────
function DateRangePicker<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: DateRangeField<T>; disabled?: boolean }) {
    const fmt = config.dateFormat ?? "LLL dd, y";
    const range: DateRange = field.value ?? {};
    return (
        <Popover>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled || config.disabled}
                    className={cn("w-full justify-start text-left font-normal", !range.from && "text-muted-foreground", config.className)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {range.from
                        ? range.to ? <>{format(range.from, fmt)} – {format(range.to, fmt)}</> : format(range.from, fmt)
                        : config.placeholder ?? "Pick a date range"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={range as any} onSelect={field.onChange}
                    fromDate={config.fromDate} toDate={config.toDate} numberOfMonths={2} initialFocus />
            </PopoverContent>
        </Popover>
    );
}

// ── Checkbox Group ────────────────────────────────────────────
function CheckboxGroup<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: CheckboxGroupField<T>; disabled?: boolean }) {
    const selected: string[] = Array.isArray(field.value) ? field.value : [];
    return (
        <div className={cn("flex gap-3", config.direction === "horizontal" ? "flex-row flex-wrap" : "flex-col")}>
            {config.options.map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox id={`${field.name}-${opt.value}`} checked={selected.includes(opt.value)}
                        onCheckedChange={(checked: boolean) =>
                            field.onChange(checked ? [...selected, opt.value] : selected.filter(v => v !== opt.value))}
                        disabled={disabled || config.disabled || opt.disabled} />
                    <label htmlFor={`${field.name}-${opt.value}`}
                        className={cn("text-sm font-normal leading-none cursor-pointer select-none",
                            (disabled || opt.disabled) && "opacity-50 cursor-not-allowed")}>
                        {opt.label}
                    </label>
                </div>
            ))}
        </div>
    );
}

// ── Radio Group ───────────────────────────────────────────────
function RadioGroup<T extends FieldValues>({ field, config, disabled }: { field: ControllerRenderProps<T, Path<T>>; config: RadioGroupField<T>; disabled?: boolean }) {
    return (
        <div className={cn("flex gap-3", config.direction === "horizontal" ? "flex-row flex-wrap" : "flex-col")}>
            {config.options.map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                    <input type="radio" id={`${field.name}-${opt.value}`} value={opt.value}
                        checked={field.value === opt.value} onChange={() => field.onChange(opt.value)}
                        disabled={disabled || config.disabled || opt.disabled}
                        className="accent-primary h-4 w-4" />
                    <label htmlFor={`${field.name}-${opt.value}`}
                        className={cn("text-sm font-normal cursor-pointer select-none",
                            (disabled || opt.disabled) && "opacity-50 cursor-not-allowed")}>
                        {opt.label}
                    </label>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  FIELD DISPATCHER
// ═══════════════════════════════════════════════════════════════

function FieldRenderer<T extends FieldValues>({
    fieldConfig, control, disabled, columns,
}: {
    fieldConfig: FormFieldConfig<T>;
    control: Control<T>;
    disabled?: boolean;
    columns: number;
}) {
    const spanClass = fieldConfig.colSpan
        ? colSpanClass(fieldConfig.colSpan)
        : spanFromColumns(columns);

    // ── Label fallback ──
    const effectiveLabel = fieldConfig.label || humanize(fieldConfig.name);

    return (
        <FormField control={control} name={fieldConfig.name} render={({ field }: { field: ControllerRenderProps<T, Path<T>> }) => (
            <FormItem className={cn(spanClass, fieldConfig.wrapperClassName, fieldConfig.type === "hidden" && "hidden")}>

                {/* Label — hidden for checkbox & switch (they render label inline) */}
                {effectiveLabel && fieldConfig.type !== "checkbox" && fieldConfig.type !== "switch" && (
                    <FormLabel>
                        {effectiveLabel}
                        {fieldConfig.required ? <LabelRequired /> : <LabelOptional />}
                    </FormLabel>
                )}

                <FormControl>
                    <>
                        {/* text / email / number / tel / url / hidden */}
                        {(["text", "email", "number", "tel", "url", "hidden"] as const).includes(fieldConfig.type as any) && (
                            <div className="relative">
                                {fieldConfig.startIcon && (
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        {React.cloneElement(fieldConfig.startIcon as React.ReactElement<any>, {
                                            className: cn("size-3.5", (fieldConfig.startIcon as any).props?.className)
                                        })}
                                    </div>
                                )}
                                <Input {...field} value={field.value ?? ""} type={fieldConfig.type as string} placeholder={fieldConfig.placeholder}
                                    disabled={disabled || fieldConfig.disabled}
                                    className={cn(fieldConfig.startIcon && "pl-8", fieldConfig.className)} />
                            </div>
                        )}

                        {fieldConfig.type === "password" && (
                            <div className="relative">
                                {fieldConfig.startIcon && (
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                                        {React.cloneElement(fieldConfig.startIcon as React.ReactElement<any>, {
                                            className: cn("size-3.5", (fieldConfig.startIcon as any).props?.className)
                                        })}
                                    </div>
                                )}
                                <PasswordInput field={field} config={fieldConfig as PasswordField<T>} disabled={disabled} />
                            </div>
                        )}

                        {fieldConfig.type === "textarea" && (
                            (fieldConfig as TextareaField<T>).autoResize
                                ? <AutoResizeTextarea field={field} config={fieldConfig as TextareaField<T>} disabled={disabled} />
                                : <Textarea {...field} value={field.value ?? ""} rows={(fieldConfig as TextareaField<T>).rows ?? 3}
                                    placeholder={fieldConfig.placeholder} disabled={disabled || fieldConfig.disabled}
                                    className={fieldConfig.className} />
                        )}

                        {fieldConfig.type === "select" && (
                            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={disabled || fieldConfig.disabled}>

                                <SelectTrigger className={cn(fieldConfig.startIcon && "pl-8", fieldConfig.className)}>
                                    {fieldConfig.startIcon && (
                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                            {React.cloneElement(fieldConfig.startIcon as React.ReactElement<any>, {
                                                className: cn("size-3.5", (fieldConfig.startIcon as any).props?.className)
                                            })}
                                        </div>
                                    )}
                                    <SelectValue placeholder={fieldConfig.placeholder ?? "Select…"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(fieldConfig as SelectField<T>).options.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                                            {opt.label}
                                            {opt.badge && <Badge variant="secondary" className="ml-2 text-xs">{opt.badge}</Badge>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {fieldConfig.type === "searchable-select" && (
                            <SearchableSelect field={field} config={fieldConfig as SearchableSelectField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "multi-select" && (
                            <MultiSelect field={field} config={fieldConfig as MultiSelectField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "date" && (
                            <DatePicker field={field} config={fieldConfig as DateField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "date-range" && (
                            <DateRangePicker field={field} config={fieldConfig as DateRangeField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "checkbox" && (
                            <div className="flex items-center gap-2 pt-1">
                                <Checkbox id={field.name} checked={!!field.value} onCheckedChange={field.onChange}
                                    disabled={disabled || fieldConfig.disabled} className={fieldConfig.className} />
                                {effectiveLabel && (
                                    <Label htmlFor={field.name} className="font-normal cursor-pointer">
                                        {effectiveLabel}
                                        {fieldConfig.required ? <LabelRequired /> : <LabelOptional />}
                                    </Label>
                                )}

                            </div>
                        )}

                        {fieldConfig.type === "checkbox-group" && (
                            <CheckboxGroup field={field} config={fieldConfig as CheckboxGroupField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "switch" && (
                            <div className="flex items-center gap-3 pt-1">
                                <Switch id={field.name} checked={!!field.value} onCheckedChange={field.onChange}
                                    disabled={disabled || fieldConfig.disabled} className={fieldConfig.className} />
                                {effectiveLabel && (
                                    <Label htmlFor={field.name} className="font-normal cursor-pointer">
                                        {effectiveLabel}
                                        {fieldConfig.required ? <LabelRequired /> : <LabelOptional />}
                                    </Label>
                                )}

                            </div>
                        )}

                        {fieldConfig.type === "radio-group" && (
                            <RadioGroup field={field} config={fieldConfig as RadioGroupField<T>} disabled={disabled} />
                        )}

                        {fieldConfig.type === "file" && (
                            <Input type="file" accept={(fieldConfig as FileField<T>).accept}
                                multiple={(fieldConfig as FileField<T>).multiple}
                                disabled={disabled || fieldConfig.disabled}
                                className={cn("cursor-pointer", fieldConfig.className)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.files)}
                                value={undefined} />
                        )}

                        {fieldConfig.type === "color" && (
                            <div className="flex items-center gap-3">
                                <input type="color" {...field} disabled={disabled || fieldConfig.disabled}
                                    className={cn("h-10 w-16 cursor-pointer rounded-md border border-input bg-background p-1", fieldConfig.className)} />
                                <span className="text-sm text-muted-foreground font-mono">{field.value}</span>
                            </div>
                        )}
                    </>
                </FormControl>

                {fieldConfig.description && <FormDescription>{fieldConfig.description}</FormDescription>}
                <FormMessage />
            </FormItem>
        )} />
    );
}

// ═══════════════════════════════════════════════════════════════
//  FIELDS GRID  (12-col responsive container)
// ═══════════════════════════════════════════════════════════════

function FieldsGrid<T extends FieldValues>({
    fieldConfigs, control, disabled, columns,
}: {
    fieldConfigs: FormFieldConfig<T>[];
    control: Control<T>;
    disabled?: boolean;
    columns: number;
}) {
    return (
        <div className="grid grid-cols-12 gap-4 gap-y-5 items-start">
            {fieldConfigs.map(fc => (
                <FieldRenderer key={String(fc.name)} fieldConfig={fc}
                    control={control} disabled={disabled} columns={columns} />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  STEP INDICATORS
// ═══════════════════════════════════════════════════════════════

function ProgressIndicator<T extends FieldValues>({
    steps, currentStep, visitedSteps,
}: { steps: FormStep<T>[]; currentStep: number; visitedSteps: Set<number> }) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
                <span className="text-xs text-muted-foreground">{steps[currentStep].title}</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1.5 mb-5" />

            {/* Step dots + connector */}
            <div className="flex items-start gap-0">
                {steps.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    return (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold transition-all duration-300",
                                    active && "border-primary bg-primary text-primary-foreground scale-110",
                                    done && "border-primary bg-primary/10 text-primary",
                                    !active && !done && "border-muted-foreground/30 bg-background text-muted-foreground"
                                )}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                                </div>
                                <span className={cn(
                                    "text-[11px] font-medium hidden sm:block text-center leading-tight max-w-[72px]",
                                    active ? "text-foreground" : "text-muted-foreground"
                                )}>{step.title}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-0.5 mx-1.5 mt-4 transition-all duration-500",
                                    i < currentStep ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

function TabsIndicator<T extends FieldValues>({
    steps, currentStep, visitedSteps,
}: { steps: FormStep<T>[]; currentStep: number; visitedSteps: Set<number> }) {
    return (
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 mb-6 overflow-x-auto">
            {steps.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                    <div key={i} className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap",
                        active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                    )}>
                        {done
                            ? <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            : step.icon
                                ? <span className="h-3.5 w-3.5 flex-shrink-0">{step.icon}</span>
                                : <Circle className={cn("h-3.5 w-3.5 flex-shrink-0", active && "text-primary")} />
                        }
                        {step.title}
                    </div>
                );
            })}
        </div>
    );
}

function SidebarIndicator<T extends FieldValues>({
    steps, currentStep,
}: { steps: FormStep<T>[]; currentStep: number }) {
    return (
        <div className="flex flex-col gap-1 w-52 flex-shrink-0">
            {steps.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                    <div key={i} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                        active && "bg-primary/5 border border-primary/20",
                        !active && "hover:bg-muted/50"
                    )}>
                        <div className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mt-0.5 flex-shrink-0 transition-all",
                            active && "bg-primary text-primary-foreground",
                            done && "bg-primary/15 text-primary",
                            !active && !done && "bg-muted text-muted-foreground"
                        )}>
                            {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <div>
                            <p className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                                {step.title}
                            </p>
                            {step.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MULTI-STEP INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

function MultiStepForm<T extends FieldValues>(props: {
    steps: FormStep<T>[];
    fields: FormFieldConfig<T>[];
    form: UseFormReturn<T>;
    onSubmit: SubmitHandler<T>;
    onReset?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    columns: number;
    submitLabel?: string;
    showReset?: boolean;
    resetLabel?: string;
    footer?: React.ReactNode;
    hideSubmit?: boolean;
    stepIndicator: "tabs" | "progress" | "sidebar";
    nextLabel: string;
    prevLabel: string;
    onStepChange?: (step: number, total: number) => void;
}) {
    const {
        steps, fields, form, onSubmit, onReset,
        disabled, isLoading, columns, submitLabel,
        showReset, resetLabel, footer, hideSubmit,
        stepIndicator, nextLabel, prevLabel, onStepChange,
    } = props;

    const [currentStep, setCurrentStep] = React.useState(0);
    const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(new Set([0]));

    const totalSteps = steps.length;
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    const stepDef = steps[currentStep];
    const stepCols = stepDef.columns ?? columns;
    const stepFields = fields.filter(f => (stepDef.fields as string[]).includes(String(f.name)));

    const goTo = (idx: number) => {
        setVisitedSteps(prev => new Set([...prev, idx]));
        setCurrentStep(idx);
        onStepChange?.(idx, totalSteps);
    };

    const handleNext = async () => {
        const valid = await form.trigger(stepDef.fields as any);
        if (!valid) return;
        goTo(currentStep + 1);
    };

    const isSidebar = stepIndicator === "sidebar";

    return (
        <div className={cn(isSidebar && "flex gap-8 items-start")}>
            {/* Sidebar */}
            {isSidebar && (
                <SidebarIndicator steps={steps} currentStep={currentStep} />
            )}

            <div className="flex-1 min-w-0">
                {/* Top indicators */}
                {stepIndicator === "progress" && (
                    <ProgressIndicator steps={steps} currentStep={currentStep} visitedSteps={visitedSteps} />
                )}
                {stepIndicator === "tabs" && (
                    <TabsIndicator steps={steps} currentStep={currentStep} visitedSteps={visitedSteps} />
                )}

                {/* Step heading */}
                <div className="mb-5">
                    <h3 className="text-base font-semibold">{stepDef.title}</h3>
                    {stepDef.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{stepDef.description}</p>
                    )}
                </div>

                {/* Fields */}
                <FieldsGrid
                    fieldConfigs={stepFields}
                    control={form.control as any}
                    disabled={disabled || isLoading}
                    columns={stepCols}
                />

                {/* Navigation */}
                {!hideSubmit && (
                    <div className="mt-6 pt-4 border-t flex items-center justify-between">
                        <Button type="button" variant="outline" onClick={() => goTo(currentStep - 1)}
                            disabled={isFirst || isLoading}>
                            <ChevronLeft className="mr-1.5 h-4 w-4" />{prevLabel}
                        </Button>

                        {!isLast ? (
                            <Button type="button" onClick={handleNext} disabled={isLoading}>
                                {nextLabel}<ChevronRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        ) : (
                            footer ?? (
                                <div className="flex gap-2">
                                    {showReset && (
                                        <Button type="button" variant="ghost" disabled={isLoading}
                                            onClick={() => { form.reset(); setCurrentStep(0); onReset?.(); }}>
                                            {resetLabel ?? "Reset"}
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={disabled} isLoading={isLoading}>
                                        {submitLabel ?? "Submit"}
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  FORM GENERATOR  ← public export
// ═══════════════════════════════════════════════════════════════

export function FormGenerator<T extends FieldValues = FieldValues>({
    fields,
    schema,
    defaultValues,
    onSubmit,
    onReset,
    submitLabel = "Submit",
    showReset = false,
    resetLabel = "Reset",
    disabled = false,
    isLoading = false,
    columns = 1,
    className,
    footer,
    hideSubmit = false,
    steps,
    stepIndicator = "progress",
    nextLabel = "Next",
    prevLabel = "Back",
    onStepChange,
}: FormGeneratorProps<T>) {
    const form = useForm<T>({
        resolver: zodResolver(schema as any),
        defaultValues,
        mode: "onTouched",
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className={cn("w-full", className)} noValidate>
                {steps ? (
                    <MultiStepForm
                        steps={steps} fields={fields} form={form as any}
                        onSubmit={onSubmit} onReset={onReset}
                        disabled={disabled} isLoading={isLoading} columns={columns}
                        submitLabel={submitLabel} showReset={showReset} resetLabel={resetLabel}
                        footer={footer} hideSubmit={hideSubmit}
                        stepIndicator={stepIndicator} nextLabel={nextLabel} prevLabel={prevLabel}
                        onStepChange={onStepChange}
                    />
                ) : (
                    <>
                        <FieldsGrid
                            fieldConfigs={fields} control={form.control as any}
                            disabled={disabled || isLoading} columns={columns}
                        />
                        {!hideSubmit && (
                            <div className="mt-6">
                                {footer ?? (
                                    <div className="flex items-center gap-3">
                                        <Button type="submit" disabled={disabled || isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {submitLabel}
                                        </Button>
                                        {showReset && (
                                            <Button type="button" variant="outline" disabled={disabled || isLoading}
                                                onClick={() => { form.reset(defaultValues); onReset?.(); }}>
                                                {resetLabel}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </form>
        </Form>
    );
}

// ═══════════════════════════════════════════════════════════════
//  USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════
//
// ────────────────────────────────────────────────────────────
//  Example 1 — Responsive single-page form
//  Row 1: First (6) + Last (6)  on ≥sm, full on mobile
//  Row 2: Email (8) + Phone (4) on ≥md, stacked on sm/xs
//  Row 3: Bio — always full width
// ────────────────────────────────────────────────────────────
//
// const schema = z.object({
//   firstName: z.string().min(1, "Required"),
//   lastName:  z.string().min(1, "Required"),
//   email:     z.string().email(),
//   phone:     z.string().optional(),
//   bio:       z.string().optional(),
// });
// type V = z.infer<typeof schema>;
//
// const fields: FormFieldConfig<V>[] = [
//   { name: "firstName", type: "text", label: "First Name", required: true,
//     colSpan: { xs: 12, sm: 6 } },
//   { name: "lastName",  type: "text", label: "Last Name",  required: true,
//     colSpan: { xs: 12, sm: 6 } },
//   { name: "email", type: "email", label: "Email", required: true,
//     colSpan: { xs: 12, md: 8 } },
//   { name: "phone", type: "tel", label: "Phone",
//     colSpan: { xs: 12, md: 4 } },
//   { name: "bio", type: "textarea", label: "Bio", autoResize: true,
//     colSpan: { xs: 12 } },
// ];
//
// <FormGenerator schema={schema} fields={fields}
//   onSubmit={console.log} submitLabel="Save" />
//
//
// ────────────────────────────────────────────────────────────
//  Example 2 — Multi-step with per-step layouts
//  Step 1: Name row (6+6), then email full
//  Step 2: Address (12), City (6) + Country (6)
//  Step 3: Plan radio, agree checkbox
// ────────────────────────────────────────────────────────────
//
// const schema = z.object({
//   firstName: z.string().min(1),
//   lastName:  z.string().min(1),
//   email:     z.string().email(),
//   address:   z.string().min(1),
//   city:      z.string().min(1),
//   country:   z.string({ required_error: "Select a country" }),
//   plan:      z.string({ required_error: "Select a plan" }),
//   agree:     z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
// });
// type V = z.infer<typeof schema>;
//
// const fields: FormFieldConfig<V>[] = [
//   { name: "firstName", type: "text",  label: "First Name", required: true, colSpan: { xs: 12, sm: 6 } },
//   { name: "lastName",  type: "text",  label: "Last Name",  required: true, colSpan: { xs: 12, sm: 6 } },
//   { name: "email",     type: "email", label: "Email",      required: true, colSpan: { xs: 12 } },
//
//   { name: "address", type: "text",              label: "Street Address", required: true, colSpan: { xs: 12 } },
//   { name: "city",    type: "text",              label: "City",           required: true, colSpan: { xs: 12, sm: 6 } },
//   { name: "country", type: "searchable-select", label: "Country",        required: true, colSpan: { xs: 12, sm: 6 },
//     options: [{ value: "pk", label: "Pakistan" }, { value: "us", label: "United States" }] },
//
//   { name: "plan", type: "radio-group", label: "Choose Plan", direction: "horizontal", colSpan: { xs: 12 },
//     options: [{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }, { value: "enterprise", label: "Enterprise" }] },
//   { name: "agree", type: "checkbox", label: "I agree to the Terms & Conditions", required: true, colSpan: { xs: 12 } },
// ];
//
// const steps: FormStep<V>[] = [
//   { title: "Personal",  description: "Tell us about yourself",  fields: ["firstName", "lastName", "email"] },
//   { title: "Address",   description: "Where are you located?",  fields: ["address", "city", "country"] },
//   { title: "Confirm",   description: "Choose a plan & confirm", fields: ["plan", "agree"] },
// ];
//
// <FormGenerator
//   schema={schema} fields={fields} steps={steps}
//   stepIndicator="progress"    // "tabs" | "progress" | "sidebar"
//   onSubmit={console.log}
//   submitLabel="Create Account"
//   nextLabel="Continue →" prevLabel="← Back"
// />
