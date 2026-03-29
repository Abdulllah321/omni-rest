"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"
import { cn } from "../lib/utils"
import { Button, buttonVariants } from "./button"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        // base surface â€” elevated card feel
        "group/calendar p-3",
        "bg-background rounded-lg",
        // amber inset rim + elevated drop
        "[box-shadow:inset_0_1px_0_rgba(239,159,39,.18),inset_0_-1px_0_rgba(0,0,0,.35),inset_1px_0_0_rgba(239,159,39,.08),inset_-1px_0_0_rgba(239,159,39,.08),0_8px_24px_-4px_rgba(0,0,0,.55),0_3px_8px_-2px_rgba(239,159,39,.10)]",
        "ring-1 ring-foreground/10",
        // cell tokens
        "[--cell-radius:var(--radius-md)]",
        "[--cell-size:--spacing(7)]",
        // transparent when inside card/popover
        "in-data-[slot=card-content]:bg-transparent in-data-[slot=card-content]:[box-shadow:none] in-data-[slot=card-content]:ring-0",
        "in-data-[slot=popover-content]:bg-transparent in-data-[slot=popover-content]:[box-shadow:none] in-data-[slot=popover-content]:ring-0",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        // nav buttons â€” ghost with amber hover
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none",
          "hover:text-[#EF9F27] aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none",
          "hover:text-[#EF9F27] aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-medium select-none text-sm",
          // amber accent on month/year label
          "text-foreground",
          captionLayout !== "label" &&
            "flex items-center gap-1 rounded-(--cell-radius) [&>svg]:size-3.5 [&>svg]:text-[#EF9F27]/60",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        // weekday headers â€” muted amber tint
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.75rem] font-medium",
          "text-[#EF9F27]/40 dark:text-[#EF9F27]/30",
          "select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-1.5 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.75rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
          "[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        // range states â€” amber fills
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius)",
          "bg-[#EF9F27]/15 dark:bg-[#EF9F27]/12",
          "after:absolute after:inset-y-0 after:right-0 after:w-4",
          "after:bg-[#EF9F27]/15 dark:after:bg-[#EF9F27]/12",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "rounded-none bg-[#EF9F27]/10 dark:bg-[#EF9F27]/8",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius)",
          "bg-[#EF9F27]/15 dark:bg-[#EF9F27]/12",
          "after:absolute after:inset-y-0 after:left-0 after:w-4",
          "after:bg-[#EF9F27]/15 dark:after:bg-[#EF9F27]/12",
          defaultClassNames.range_end
        ),
        // today â€” subtle amber ring
        today: cn(
          "rounded-(--cell-radius)",
          "ring-1 ring-[#EF9F27]/30 dark:ring-[#EF9F27]/25",
          "text-foreground",
          "data-[selected=true]:rounded-none data-[selected=true]:ring-0",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/40 aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/30 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeft className={cn("size-4", className)} {...props} />
          if (orientation === "right")
            return <ChevronRight className={cn("size-4", className)} {...props} />
          return <ChevronDown className={cn("size-4", className)} {...props} />
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // layout
        "relative isolate z-10",
        "flex aspect-square size-auto w-full min-w-(--cell-size)",
        "flex-col gap-1 border-0 leading-none font-normal",
        // transition
        "transition-all duration-150",
        // hover â€” amber tint
        "hover:bg-[#EF9F27]/10 hover:text-[#EF9F27] dark:hover:text-[#EF9F27]",
        // focus ring
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-[#EF9F27]/40",
        // selected single â€” amber fill
        "data-[selected-single=true]:bg-[#EF9F27] data-[selected-single=true]:text-[#412402]",
        "data-[selected-single=true]:hover:bg-[#EF9F27]/90",
        "data-[selected-single=true]:[box-shadow:inset_0_1px_0_rgba(255,255,255,.18),0_2px_6px_rgba(133,79,11,.30)]",
        // range start/end â€” amber fill
        "data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius)",
        "data-[range-start=true]:bg-[#EF9F27] data-[range-start=true]:text-[#412402]",
        "data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius)",
        "data-[range-end=true]:bg-[#EF9F27] data-[range-end=true]:text-[#412402]",
        // range middle â€” subtle amber tint
        "data-[range-middle=true]:rounded-none",
        "data-[range-middle=true]:bg-[#EF9F27]/10 data-[range-middle=true]:text-foreground",
        // event dot
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }