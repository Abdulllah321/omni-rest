"use client"

/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 *  AlertDialog.tsx â€” Falah RMS Premium AlertDialog
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 *  VARIANTS (on AlertDialogContent)
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ default     â€” amber inset rim, neutral tone
 *  âœ¦ destructive â€” red inset rim, red-tinted overlay (delete/void)
 *  âœ¦ warning     â€” amber-orange rim, amber overlay (risky action)
 *  âœ¦ info        â€” blue rim, blue overlay (informational confirm)
 *
 *  MEDIA ICON VARIANTS (on AlertDialogMedia)
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ default / destructive / warning / info / success
 *  Each gets a matching background tint + icon color
 *
 *  DEPENDENCIES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *    npm install @radix-ui/react-alert-dialog class-variance-authority
 *
 *  ZERO BREAKING CHANGES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  All original exports work identically. Variants are additive.
 *
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"
import { Button } from "./button"

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PRIMITIVES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  OVERLAY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const overlayVariants = cva(
  [
    "fixed inset-0 isolate z-50",
    "duration-150",
    "supports-backdrop-filter:backdrop-blur-sm",
    "data-open:animate-in data-open:fade-in-0",
    "data-closed:animate-out data-closed:fade-out-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-black/75 dark:bg-black/80",
        destructive: "bg-red-950/55 dark:bg-red-950/65",
        warning: "bg-amber-950/40 dark:bg-amber-950/55",
        info: "bg-blue-950/40 dark:bg-blue-950/55",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & {
    variant?: "default" | "destructive" | "warning" | "info"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    data-slot="alert-dialog-overlay"
    className={cn(overlayVariants({ variant }), className)}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CONTENT VARIANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const contentVariants = cva(
  [
    // position
    "group/alert-dialog-content",
    "fixed top-1/2 left-1/2 z-50",
    "-translate-x-1/2 -translate-y-1/2",
    // layout
    "grid w-full gap-0 rounded-xl",
    // surface
    "bg-background dark:bg-[#1E1A15]",
    "ring-1",
    // text
    "text-xs/relaxed",
    // animation
    "duration-150 outline-none",
    "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]",
    "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // amber rim â€” standard confirm
        default: [
          "ring-foreground/10",
          "[box-shadow:inset_0_1px_0_rgba(239,159,39,.22),inset_0_-1px_0_rgba(0,0,0,.40),inset_1px_0_0_rgba(239,159,39,.10),inset_-1px_0_0_rgba(239,159,39,.10),0_8px_32px_-4px_rgba(0,0,0,.65),0_4px_12px_-2px_rgba(239,159,39,.12),0_2px_4px_rgba(0,0,0,.40)]",
        ].join(" "),

        // red rim â€” delete / void / irreversible
        destructive: [
          "ring-destructive/25 dark:ring-destructive/30",
          "[box-shadow:inset_0_1px_0_rgba(239,68,68,.16),inset_0_-1px_0_rgba(0,0,0,.40),inset_1px_0_0_rgba(239,68,68,.10),inset_-1px_0_0_rgba(239,68,68,.10),0_8px_32px_-4px_rgba(0,0,0,.65),0_4px_12px_-2px_rgba(239,68,68,.16)]",
        ].join(" "),

        // amber-orange rim â€” risky but reversible
        warning: [
          "ring-amber-500/20 dark:ring-amber-500/25",
          "[box-shadow:inset_0_1px_0_rgba(245,158,11,.22),inset_0_-1px_0_rgba(0,0,0,.38),inset_1px_0_0_rgba(245,158,11,.10),inset_-1px_0_0_rgba(245,158,11,.10),0_8px_32px_-4px_rgba(0,0,0,.60),0_4px_12px_-2px_rgba(245,158,11,.14)]",
        ].join(" "),

        // blue rim â€” info / confirm only
        info: [
          "ring-blue-500/20 dark:ring-blue-500/25",
          "[box-shadow:inset_0_1px_0_rgba(59,130,246,.18),inset_0_-1px_0_rgba(0,0,0,.38),inset_1px_0_0_rgba(59,130,246,.08),inset_-1px_0_0_rgba(59,130,246,.08),0_8px_32px_-4px_rgba(0,0,0,.60),0_4px_12px_-2px_rgba(59,130,246,.12)]",
        ].join(" "),
      },

      size: {
        sm: "max-w-[calc(100%-2rem)] sm:max-w-64",
        default: "max-w-[calc(100%-2rem)] sm:max-w-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CONTENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> &
  VariantProps<typeof contentVariants> & {
    overlayVariant?: "default" | "destructive" | "warning" | "info"
  }
>(({ className, variant = "default", size = "default", overlayVariant, ...props }, ref) => {
  // Auto-match overlay to content variant unless explicitly overridden
  const resolvedOverlay = overlayVariant ?? (
    variant === "destructive" ? "destructive"
      : variant === "warning" ? "warning"
        : variant === "info" ? "info"
          : "default"
  )

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay variant={resolvedOverlay} />
      <AlertDialogPrimitive.Content
        ref={ref}
        data-slot="alert-dialog-content"
        data-size={size}
        data-variant={variant}
        className={cn(contentVariants({ variant, size }), className)}
        {...props}
      />
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  HEADER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1 text-center",
        "px-4 pt-5 pb-3",
        // with media icon â€” extra column
        "has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr]",
        "has-data-[slot=alert-dialog-media]:gap-x-4",
        // sm:left-align on default size
        "sm:group-data-[size=default]/alert-dialog-content:place-items-start",
        "sm:group-data-[size=default]/alert-dialog-content:text-left",
        "sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FOOTER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2",
        "px-4 pb-4 pt-1",
        // amber-tinted divider when border-t used
        "[&.border-t]:border-[#EF9F27]/10 dark:[&.border-t]:border-[#EF9F27]/8",
        "group-data-[size=sm]/alert-dialog-content:grid",
        "group-data-[size=sm]/alert-dialog-content:grid-cols-2",
        "sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MEDIA ICON  â€” semantic tinted icon container
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const mediaVariants = cva(
  [
    "mb-2 inline-flex items-center justify-center rounded-lg",
    "size-10 shrink-0",
    "*:[svg:not([class*='size-'])]:size-5",
    "sm:group-data-[size=default]/alert-dialog-content:row-span-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-[#EF9F27]/12 text-[#EF9F27] dark:bg-[#EF9F27]/10",
        destructive: "bg-destructive/10 text-destructive dark:bg-destructive/15",
        warning: "bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
        info: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
        success: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function AlertDialogMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof mediaVariants>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(mediaVariants({ variant }), className)}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TITLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    data-slot="alert-dialog-title"
    className={cn(
      "text-sm font-medium leading-snug",
      "sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DESCRIPTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    data-slot="alert-dialog-description"
    className={cn(
      "text-xs/relaxed text-balance text-muted-foreground md:text-pretty",
      // links
      "*:[a]:underline *:[a]:underline-offset-3",
      "*:[a]:hover:text-[#EF9F27]",
      className
    )}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  ACTION  â€” primary confirm button
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} asChild>
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  </AlertDialogPrimitive.Action>
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CANCEL  â€” dismiss / go back
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">
>(({ className, variant = "outline", size = "default", ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} asChild>
    <Button
      data-slot="alert-dialog-cancel"
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  </AlertDialogPrimitive.Cancel>
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DIVIDER  â€” amber-tinted hairline between sections
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AlertDialogDivider({ className }: { className?: string }) {
  return (
    <hr className={cn(
      "border-none h-px mx-0",
      "bg-[#EF9F27]/10 dark:bg-[#EF9F27]/8",
      className
    )} />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  EXPORTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogDivider,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  USAGE EXAMPLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
// â”€â”€ Delete confirm (destructive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <AlertDialog>
//   <AlertDialogTrigger asChild>
//     <Button variant="destructive">Delete Branch</Button>
//   </AlertDialogTrigger>
//   <AlertDialogContent variant="destructive">
//     <AlertDialogHeader>
//       <AlertDialogMedia variant="destructive">
//         <TrashIcon />
//       </AlertDialogMedia>
//       <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
//       <AlertDialogDescription>
//         This will permanently remove DHA Phase 6 and all its data.
//       </AlertDialogDescription>
//     </AlertDialogHeader>
//     <AlertDialogDivider />
//     <AlertDialogFooter>
//       <AlertDialogCancel>Cancel</AlertDialogCancel>
//       <AlertDialogAction variant="destructive">
//         Delete permanently
//       </AlertDialogAction>
//     </AlertDialogFooter>
//   </AlertDialogContent>
// </AlertDialog>
//
// â”€â”€ Void order (warning) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <AlertDialogContent variant="warning">
//   <AlertDialogHeader>
//     <AlertDialogMedia variant="warning"><AlertTriangle /></AlertDialogMedia>
//     <AlertDialogTitle>Void this order?</AlertDialogTitle>
//     <AlertDialogDescription>
//       Order #4821 will be marked void. Stock will be restored.
//     </AlertDialogDescription>
//   </AlertDialogHeader>
//   <AlertDialogFooter>
//     <AlertDialogCancel>Keep order</AlertDialogCancel>
//     <AlertDialogAction>Void order</AlertDialogAction>
//   </AlertDialogFooter>
// </AlertDialogContent>
//
// â”€â”€ Info confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <AlertDialogContent variant="info" size="sm">
//   <AlertDialogHeader>
//     <AlertDialogTitle>Sync all branches?</AlertDialogTitle>
//     <AlertDialogDescription>
//       Menu changes will push to all 4 branches immediately.
//     </AlertDialogDescription>
//   </AlertDialogHeader>
//   <AlertDialogFooter>
//     <AlertDialogCancel>Cancel</AlertDialogCancel>
//     <AlertDialogAction>Sync now</AlertDialogAction>
//   </AlertDialogFooter>
// </AlertDialogContent>