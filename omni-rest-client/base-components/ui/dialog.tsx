"use client"

/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 *  Dialog.tsx â€” Falah RMS Premium Dialog
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 *  VARIANTS
 *  â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ default     â€” standard modal, elevated card shadow + amber rim
 *  âœ¦ destructive â€” red-tinted overlay + red rim for confirm-delete
 *  âœ¦ sheet-right â€” slides in from the right (drawer/side panel)
 *  âœ¦ sheet-bottom â€” slides up from bottom (mobile-first actions)
 *
 *  SIZES
 *  â”€â”€â”€â”€â”€
 *  âœ¦ sm / default / lg / full
 *
 *  SURFACE
 *  â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ Overlay: dark/80 + backdrop-blur â€” same as your glass card
 *  âœ¦ Popup: elevated card shadow â€” full amber inset rim on dark,
 *    warm amber-brown deep drop on light
 *  âœ¦ Header divider: amber-tinted hairline
 *  âœ¦ Footer divider: amber-tinted hairline
 *  âœ¦ Close button: ghost with amber hover
 *
 *  ZERO BREAKING CHANGES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  All original exports preserved. Variants are additive props.
 *
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { X } from "lucide-react"

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PRIMITIVES â€” unchanged wrappers
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  OVERLAY
//  â€” backdrop blur + dark tint
//  â€” destructive variant adds a subtle red tint
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    variant?: "default" | "destructive"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn(
      // base
      "fixed inset-0 isolate z-50",
      "duration-150",
      // blur + dark tint
      "supports-backdrop-filter:backdrop-blur-sm",
      // default overlay
      variant === "default" && "bg-black/75 dark:bg-black/80",
      // destructive â€” very subtle red tint over the blur
      variant === "destructive" && "bg-red-950/60 dark:bg-red-950/70",
      // animations
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CONTENT VARIANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const dialogContentVariants = cva(
  [
    // stacking & positioning base
    "fixed z-50 outline-none",
    "text-xs/relaxed",
    // surface
    "bg-background dark:bg-[#1E1A15]",
    // border
    "ring-1 ring-foreground/10",
    // transitions
    "duration-150",
  ].join(" "),
  {
    variants: {
      variant: {
        // â”€â”€ Centered modal (default) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        default: [
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "grid w-full gap-0 rounded-xl",
          // premium shadow â€” full amber rim on dark, warm drop on light
          "[box-shadow:var(--dialog-shadow)]",
          // enter from center
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
        ].join(" "),

        // â”€â”€ Destructive â€” red rim accent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        destructive: [
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "grid w-full gap-0 rounded-xl",
          // red rim instead of amber
          "ring-1 ring-destructive/20 dark:ring-destructive/30",
          "[box-shadow:inset_0_1px_0_rgba(239,68,68,.12),inset_0_-1px_0_rgba(0,0,0,.35),inset_1px_0_0_rgba(239,68,68,.08),inset_-1px_0_0_rgba(239,68,68,.08),0_8px_24px_-4px_rgba(0,0,0,.60),0_3px_8px_-2px_rgba(239,68,68,.12)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
        ].join(" "),

        // â”€â”€ Sheet â€” slides from right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "sheet-right": [
          "top-0 right-0 bottom-0",
          "h-full w-full flex flex-col gap-0",
          "rounded-l-xl rounded-r-none",
          "[box-shadow:var(--dialog-shadow-sheet-right)]",
          // slide from right
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
        ].join(" "),

        // â”€â”€ Sheet â€” slides from bottom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "sheet-bottom": [
          "bottom-0 left-0 right-0",
          "w-full flex flex-col gap-0",
          "rounded-t-xl rounded-b-none",
          "[box-shadow:var(--dialog-shadow-sheet-bottom)]",
          // slide from bottom
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
        ].join(" "),
      },

      size: {
        sm: "max-w-[calc(100%-2rem)] sm:max-w-xs",
        default: "max-w-[calc(100%-2rem)] sm:max-w-sm",
        lg: "max-w-[calc(100%-2rem)] sm:max-w-lg",
        full: "max-w-[calc(100%-2rem)] sm:max-w-2xl",
        // sheet sizes override width
        "sheet-sm": "sm:max-w-xs",
        "sheet-md": "sm:max-w-sm",
        "sheet-lg": "sm:max-w-md",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CONTENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
    overlayVariant?: "default" | "destructive"
  }
>(({ className, children, showCloseButton = true, variant = "default", size = "default", overlayVariant = "default", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay variant={overlayVariant} />
    <DialogPrimitive.Content
      ref={ref}
      data-slot="dialog-content"
      data-variant={variant}
      className={cn(
        dialogContentVariants({ variant, size }),
        className
      )}
      {...props}
    >
      {children}

      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            data-slot="dialog-close"
            className={cn(
              "absolute top-2.5 right-2.5",
              // amber hover on close button
              "hover:text-[#EF9F27] hover:bg-[#EF9F27]/10",
              "dark:hover:bg-[#EF9F27]/10",
              // destructive variant â€” red hover
              "data-[variant=destructive]:hover:text-destructive",
              "data-[variant=destructive]:hover:bg-destructive/10",
            )}
          >
            <X className="size-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  HEADER
//  â€” title + description block
//  â€” amber-tinted bottom divider via border-b utility
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1",
        "px-4 pt-4 pb-3",
        // amber-tinted divider when border-b is applied
        "[&.border-b]:border-[#EF9F27]/12 dark:[&.border-b]:border-[#EF9F27]/10",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  BODY
//  â€” scrollable content area between header and footer
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 overflow-y-auto",
        "px-4 py-3",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FOOTER
//  â€” action buttons row
//  â€” amber-tinted top divider via border-t utility
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        "px-4 pt-3 pb-4",
        // amber-tinted top border when border-t is applied
        "[&.border-t]:border-[#EF9F27]/12 dark:[&.border-t]:border-[#EF9F27]/10",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TITLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn(
      "text-sm font-medium leading-snug",
      // pr to avoid overlap with close button
      "pr-6",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DESCRIPTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn(
      "text-xs/relaxed text-muted-foreground",
      // link styles
      "*:[a]:underline *:[a]:underline-offset-3",
      "*:[a]:hover:text-[#EF9F27]",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DIVIDER  â€” amber-tinted hairline between sections
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DialogDivider({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        "border-none h-px mx-0",
        "bg-[#EF9F27]/10 dark:bg-[#EF9F27]/8",
        className
      )}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  EXPORTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogDivider,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  USAGE EXAMPLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
// â”€â”€ Standard modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Dialog>
//   <DialogTrigger asChild><Button>New Branch</Button></DialogTrigger>
//   <DialogContent>
//     <DialogHeader className="border-b">
//       <DialogTitle>Create Branch</DialogTitle>
//       <DialogDescription>Add a new location to your network.</DialogDescription>
//     </DialogHeader>
//     <DialogBody>
//       <Input placeholder="Branch name" />
//     </DialogBody>
//     <DialogFooter className="border-t">
//       <Button variant="outline">Cancel</Button>
//       <Button>Create â†’</Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>
//
// â”€â”€ Destructive confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <DialogContent variant="destructive" overlayVariant="destructive">
//   <DialogHeader>
//     <DialogTitle>Delete Branch</DialogTitle>
//     <DialogDescription>This cannot be undone.</DialogDescription>
//   </DialogHeader>
//   <DialogFooter>
//     <Button variant="outline">Cancel</Button>
//     <Button variant="destructive">Delete permanently</Button>
//   </DialogFooter>
// </DialogContent>
//
// â”€â”€ Right sheet / drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <DialogContent variant="sheet-right" size="sheet-md">
//   <DialogHeader className="border-b">
//     <DialogTitle>Branch Settings</DialogTitle>
//   </DialogHeader>
//   <DialogBody>â€¦</DialogBody>
//   <DialogFooter className="border-t">
//     <Button>Save changes</Button>
//   </DialogFooter>
// </DialogContent>
//
// â”€â”€ Bottom sheet (mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <DialogContent variant="sheet-bottom">
//   <DialogHeader>
//     <DialogTitle>Quick Actions</DialogTitle>
//   </DialogHeader>
//   <DialogBody>â€¦</DialogBody>
// </DialogContent>