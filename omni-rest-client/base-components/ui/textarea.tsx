"use client"

import * as React from "react"
import { cn } from "../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // layout
        "flex field-sizing-content min-h-16 w-full resize-none rounded-md",
        "px-2 py-2 text-sm md:text-xs/relaxed",
        "transition-all duration-150 outline-none",
        // surface
        "border border-input",
        "bg-input/20 dark:bg-[#161310]",
        // inner shadow â€” matches Input exactly
        "[box-shadow:inset_0_1px_2px_rgba(0,0,0,.06)]",
        "dark:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.45),inset_0_0_0_1px_rgba(239,159,39,.04)]",
        // placeholder
        "placeholder:text-muted-foreground",
        // focus
        "focus-visible:border-[#EF9F27]/60 dark:focus-visible:border-[#EF9F27]/50",
        "focus-visible:ring-2 focus-visible:ring-[#EF9F27]/20 dark:focus-visible:ring-[#EF9F27]/15",
        "focus-visible:[box-shadow:inset_0_1px_2px_rgba(0,0,0,.06),0_0_0_3px_rgba(239,159,39,.10)]",
        "dark:focus-visible:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.50),inset_0_0_0_1px_rgba(239,159,39,.10),0_0_0_3px_rgba(239,159,39,.08)]",
        // resize handle â€” hide default, show subtle amber tinted one
        "resize-y",
        // disabled / invalid
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }