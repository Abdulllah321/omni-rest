"use client"

import * as React from "react"
import { cn } from "../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          // layout & shape
          "h-7 w-full min-w-0 rounded-md px-2 py-0.5",
          "text-sm md:text-xs/relaxed",
          "transition-all duration-150 outline-none",
          // surface â€” dark mode: deeper fill so it reads against charcoal bg
          "border border-input",
          "bg-input/20 dark:bg-[#161310]",
          // inner shadow at rest â€” pressed-in feel
          "[box-shadow:var(--input-shadow,inset_0_1px_2px_rgba(0,0,0,.06))]",
          "dark:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.45),inset_0_0_0_1px_rgba(239,159,39,.04)]",
          // placeholder
          "placeholder:text-muted-foreground",
          // file input
          "file:inline-flex file:h-6 file:border-0 file:bg-transparent",
          "file:text-xs/relaxed file:font-medium file:text-foreground",
          // focus â€” amber ring
          "focus-visible:border-[#EF9F27]/60 dark:focus-visible:border-[#EF9F27]/50",
          "focus-visible:ring-2 focus-visible:ring-[#EF9F27]/20 dark:focus-visible:ring-[#EF9F27]/15",
          "focus-visible:[box-shadow:inset_0_1px_2px_rgba(0,0,0,.06),0_0_0_3px_rgba(239,159,39,.10)]",
          "dark:focus-visible:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.50),inset_0_0_0_1px_rgba(239,159,39,.10),0_0_0_3px_rgba(239,159,39,.08)]",
          // disabled
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // invalid
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
