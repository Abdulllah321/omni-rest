"use client"

import * as React from "react"
import { cn } from "../lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // layout
        "flex items-center gap-2",
        // typography â€” slightly warmer than stock muted
        "text-xs/relaxed leading-none font-medium",
        "text-foreground/80 dark:text-foreground/70",
        // amber accent on required asterisk (*) child
        "[&_[data-required]]:text-[#EF9F27]",
        "[&_[data-required]]:ml-0.5",
        // select-none always
        "select-none",
        // disabled states
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

// Required asterisk â€” use inside Label for required fields
// <Label>Email <LabelRequired /></Label>
function LabelRequired({ className }: { className?: string }) {
  return (
    <span
      data-required
      aria-hidden="true"
      className={cn("text-[#EF9F27] text-xs leading-none", className)}
    >
      *
    </span>
  )
}

// Optional tag â€” use inside Label for optional fields
// <Label>Phone <LabelOptional /></Label>
function LabelOptional({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-normal text-muted-foreground/60",
        "ml-0.5",
        className
      )}
    >
      (optional)
    </span>
  )
}

export { Label, LabelRequired, LabelOptional }