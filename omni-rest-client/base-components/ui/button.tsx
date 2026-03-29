"use client"

/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 *  Button.tsx â€” Enhanced Shadcn Button with Micro-interactions
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 *  MICRO-INTERACTIONS
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ Text swipe-up on hover  â€” the label slides up & fades out,
 *    a ghost duplicate slides in from below. Pure CSS, zero JS.
 *    Opt-in via  swipeText={true}  or always-on via variant default.
 *
 *  âœ¦ Magnetic press  â€” subtle translateY(1px) + scale-down on
 *    active:, giving a tactile "click" sensation.
 *
 *  âœ¦ Ripple effect  â€” ink-circle expands from the exact click
 *    point and fades out. Entirely CSS-driven via a pseudo-element
 *    seeded with CSS custom properties set from a click handler.
 *
 *  âœ¦ Shimmer on hover (loading variant)  â€” a light sweep across
 *    the button surface while in the pending state.
 *
 *  LOADING STATES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ isLoading prop â€” replaces content with a spinner + optional
 *    loadingText, while preserving the exact button width so the
 *    layout never shifts.
 *
 *  âœ¦ Three spinner styles via loadingVariant:
 *      "spinner"  â†’ rotating circle arc (default)
 *      "dots"     â†’ three bouncing dots
 *      "shimmer"  â†’ shimmer sweep only, no spinner icon
 *
 *  âœ¦ loadingPosition: "start" | "end" | "replace" (default)
 *      "start"   â†’ spinner at left, text stays
 *      "end"     â†’ spinner at right, text stays
 *      "replace" â†’ text hidden, spinner centred
 *
 *  ADDITIONAL PROPS
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ swipeText    â†’ enable the slide-up text hover effect
 *  âœ¦ leftIcon / rightIcon  â†’ typed icon slots
 *  âœ¦ asChild      â†’ Radix UI Slot composition pattern
 *  âœ¦ All original shadcn variants & sizes are preserved 1-to-1
 *
 *  DEPENDENCIES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *    npm install class-variance-authority @radix-ui/react-slot lucide-react
 *
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "../lib/utils"

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  VARIANTS  (identical to your original â€” zero breaking changes)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const buttonVariants = cva(
  [
    // layout
    "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-md border border-transparent bg-clip-padding",
    // typography
    "text-xs/relaxed font-medium whitespace-nowrap",
    // transitions â€” slightly longer so the swipe feels smooth
    "transition-all duration-200 outline-none select-none",
    // focus
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
    // press
    "active:translate-y-px active:scale-[0.98]",
    // states
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // icon children
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export type LoadingVariant = "spinner" | "dots" | "shimmer"
export type LoadingPosition = "start" | "end" | "replace"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {

  className?: string
  /** Enable the slide-up text swipe effect on hover */
  swipeText?: boolean
  /** Show loading state â€” replaces or supplements the label */
  isLoading?: boolean
  /** Text shown during loading (only used with loadingPosition â‰  "replace") */
  loadingText?: string
  /** Spinner style: "spinner" | "dots" | "shimmer" */
  loadingVariant?: LoadingVariant
  /** Where to show the spinner relative to label */
  loadingPosition?: LoadingPosition
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode
  /** Render as a child component (Radix UI Slot pattern) */
  asChild?: boolean
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SPINNER COMPONENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />
  )
}

function DotsSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "600ms" }}
        />
      ))}
    </span>
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SWIPE-UP TEXT WRAPPER
//  Duplicates the children into two layers:
//    â€¢ top    â€” visible at rest, slides up + fades out on hover
//    â€¢ bottom â€” sits below, slides up into view on hover
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function SwipeLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex flex-col overflow-hidden leading-none h-[1em]">
      {/* visible at rest â†’ exits upward */}
      <span
        className="inline-flex items-center gap-1 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/button:-translate-y-full group-hover/button:opacity-0 opacity-100"
        aria-hidden="false"
      >
        {children}
      </span>
      {/* enters from below */}
      <span
        className="absolute inset-0 inline-flex items-center gap-1 translate-y-full opacity-0 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/button:translate-y-0 group-hover/button:opacity-100"
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  RIPPLE
//  On click: reads pointer position â†’ animates a radial-gradient
//  pseudo-element via CSS custom properties injected inline.
//  Entirely CSS-driven after the click handler sets the coords.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function useRipple() {
  const [ripples, setRipples] = React.useState<
    { id: number; x: number; y: number; size: number }[]
  >([])

  const addRipple = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      const id = Date.now()
      setRipples((prev) => [...prev, { id, x, y, size }])
      setTimeout(
        () => setRipples((prev) => prev.filter((r) => r.id !== id)),
        600
      )
    },
    []
  )

  const RippleContainer = React.useCallback(
    () => (
      <>
        {ripples.map(({ id, x, y, size }) => (
          <span
            key={id}
            className="pointer-events-none absolute rounded-full bg-white/20 animate-ripple"
            style={{ left: x, top: y, width: size, height: size }}
          />
        ))}
      </>
    ),
    [ripples]
  )

  return { addRipple, RippleContainer }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SHIMMER OVERLAY  (used for loadingVariant="shimmer")
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function ShimmerOverlay() {
  return (
    <span
      className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
      aria-hidden="true"
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  BUTTON
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "default",
    size = "default",
    swipeText = true,
    isLoading = false,
    loadingText,
    loadingVariant = "spinner",
    loadingPosition = "replace",
    leftIcon,
    rightIcon,
    children,
    onClick,
    disabled,
    asChild = false,
    ...props
  }, ref) => {
    const { addRipple, RippleContainer } = useRipple()

    // Don't show swipe on icon-only buttons or when loading
    const showSwipe = swipeText && !isLoading && size !== "icon" && size !== "icon-xs" && size !== "icon-sm" && size !== "icon-lg"

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isLoading) {
          addRipple(e)
            ; (onClick as React.MouseEventHandler<HTMLButtonElement>)?.(e)
        }
      },
      [isLoading, addRipple, onClick]
    )

    // â”€â”€ Spinner node â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const spinnerNode =
      loadingVariant === "dots" ? (
        <DotsSpinner className="size-3.5" />
      ) : loadingVariant === "shimmer" ? null : (
        <SpinnerIcon className="size-3.5" />
      )

    // â”€â”€ Resolve displayed content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let content: React.ReactNode

    if (isLoading) {
      if (loadingPosition === "replace") {
        // Width is locked to whatever the button normally measures
        // because we render children as invisible underneath
        content = (
          <>
            {/* invisible ghost keeps width stable */}
            <span className="invisible flex items-center gap-1" aria-hidden="true">
              {leftIcon}
              {children}
              {rightIcon}
            </span>
            {/* centred spinner overlay */}
            <span className="absolute inset-0 flex items-center justify-center gap-1.5">
              {loadingVariant !== "shimmer" && spinnerNode}
              {loadingText && (
                <span className="text-xs/relaxed">{loadingText}</span>
              )}
            </span>
            {loadingVariant === "shimmer" && <ShimmerOverlay />}
          </>
        )
      } else if (loadingPosition === "start") {
        content = (
          <>
            {spinnerNode}
            <span>{loadingText ?? children}</span>
            {loadingVariant === "shimmer" && <ShimmerOverlay />}
          </>
        )
      } else {
        // "end"
        content = (
          <>
            <span>{loadingText ?? children}</span>
            {spinnerNode}
            {loadingVariant === "shimmer" && <ShimmerOverlay />}
          </>
        )
      }
    } else {
      // Normal state â€” optionally wrap text in SwipeLabel
      const label = showSwipe ? (
        <SwipeLabel>
          {leftIcon}
          {children}
          {rightIcon}
        </SwipeLabel>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )
      content = label
    }

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || disabled || undefined}
        onClick={handleClick}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <RippleContainer />
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"


export { Button, buttonVariants }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  REQUIRED: add these keyframes to your tailwind.config.ts
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
//  theme: {
//    extend: {
//      keyframes: {
//        ripple: {
//          "0%":   { transform: "scale(0)",    opacity: "0.35" },
//          "100%": { transform: "scale(1)",    opacity: "0"    },
//        },
//        shimmer: {
//          "0%":   { transform: "translateX(-100%)" },
//          "100%": { transform: "translateX(200%)"  },
//        },
//      },
//      animation: {
//        ripple:  "ripple 0.6s ease-out forwards",
//        shimmer: "shimmer 1.4s ease-in-out infinite",
//      },
//    },
//  },
//
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  USAGE EXAMPLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
// â”€â”€ 1. Text swipe-up hover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button swipeText>Continue</Button>
// <Button swipeText variant="outline">Save changes</Button>
//
// â”€â”€ 2. Loading â€” replace content, lock width â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button isLoading>Submit</Button>
// <Button isLoading loadingText="Savingâ€¦" loadingPosition="start">
//   Save
// </Button>
//
// â”€â”€ 3. Dots loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button isLoading loadingVariant="dots" loadingPosition="replace">
//   Processing
// </Button>
//
// â”€â”€ 4. Shimmer-only (no spinner icon) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button isLoading loadingVariant="shimmer" loadingPosition="end">
//   Uploading
// </Button>
//
// â”€â”€ 5. Swipe + left icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button swipeText leftIcon={<PlusIcon />}>New item</Button>
//
// â”€â”€ 6. Icon button (no swipe, still has ripple) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Button size="icon" variant="ghost"><TrashIcon /></Button>
//
// â”€â”€ 7. Controlled loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// const [saving, setSaving] = useState(false)
// <Button
//   isLoading={saving}
//   loadingText="Savingâ€¦"
//   loadingPosition="start"
//   swipeText={!saving}
//   onClick={async () => {
//     setSaving(true)
//     await save()
//     setSaving(false)
//   }}
// >
//   Save changes
// </Button>