"use client"

/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 *  Popover.tsx â€” Falah RMS Premium Popover
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 *  VARIANTS (on PopoverContent)
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ default  â€” elevated card shadow, amber inset rim
 *  âœ¦ compact  â€” tighter padding, for small contextual menus
 *  âœ¦ flush    â€” no padding, for custom content (calendars, lists)
 *
 *  SIZES
 *  â”€â”€â”€â”€â”€
 *  âœ¦ sm (w-48) / default (w-72) / lg (w-96) / auto
 *
 *  ZERO BREAKING CHANGES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  All original exports work identically.
 *
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverClose = PopoverPrimitive.Close

const popoverContentVariants = cva(
  [
    // base
    "z-50 flex flex-col",
    "rounded-lg outline-hidden",
    // surface
    "bg-popover dark:bg-[#1E1A15]",
    "text-xs text-popover-foreground",
    // ring
    "ring-1 ring-foreground/10",
    // premium shadow â€” elevated card
    "[box-shadow:var(--popover-shadow,inset_0_1px_0_rgba(239,159,39,.18),0_8px_24px_-4px_rgba(0,0,0,.55),0_3px_8px_-2px_rgba(239,159,39,.10))]",
    // animation â€” side-aware slide-in
    "duration-100",
    "data-[side=bottom]:slide-in-from-top-2",
    "data-[side=top]:slide-in-from-bottom-2",
    "data-[side=left]:slide-in-from-right-2",
    "data-[side=right]:slide-in-from-left-2",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "gap-3 p-3",
        compact: "gap-2 p-2",
        flush: "gap-0 p-0 overflow-hidden",
      },
      size: {
        sm: "w-48",
        default: "w-72",
        lg: "w-96",
        auto: "w-auto min-w-32",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  VariantProps<typeof popoverContentVariants> {}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, variant = "default", size = "default", align = "center", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      data-slot="popover-content"
      className={cn(popoverContentVariants({ variant, size }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn(
        "flex flex-col gap-0.5",
        // amber-tinted bottom divider when border-b used
        "[&.border-b]:border-[#EF9F27]/10 dark:[&.border-b]:border-[#EF9F27]/8",
        className
      )}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="popover-title"
      className={cn(
        "text-xs font-medium leading-snug",
        className
      )}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn(
        "text-xs/relaxed text-muted-foreground",
        "*:[a]:underline *:[a]:underline-offset-3",
        "*:[a]:hover:text-[#EF9F27]",
        className
      )}
      {...props}
    />
  )
}

function PopoverDivider({ className }: { className?: string }) {
  return (
    <hr className={cn(
      "border-none h-px",
      "bg-[#EF9F27]/10 dark:bg-[#EF9F27]/8",
      className
    )} />
  )
}

function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn(
        "flex items-center justify-end gap-2",
        "pt-2",
        "[&.border-t]:border-[#EF9F27]/10 dark:[&.border-t]:border-[#EF9F27]/8",
        className
      )}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverDivider,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
