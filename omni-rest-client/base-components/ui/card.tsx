"use client"

/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 *  Card.tsx â€” Falah RMS Premium Card System
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 *  VARIANTS
 *  â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ default    â€” standard elevated card, amber inset rim
 *  âœ¦ ghost      â€” no background, border only, ultra minimal
 *  âœ¦ elevated   â€” stronger shadow, floats above the page
 *  âœ¦ filled     â€” solid amber-tinted surface, for stat highlights
 *  âœ¦ amber      â€” full amber accent card, primary CTA surfaces
 *  âœ¦ glass      â€” frosted glass effect, for overlays & drawers
 *  âœ¦ flat       â€” zero shadow, flush with background, tabular use
 *
 *  SIZES
 *  â”€â”€â”€â”€â”€
 *  âœ¦ default / sm / lg
 *
 *  INTERACTIVE
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  âœ¦ interactive prop â€” hover lift + shadow deepen + cursor pointer
 *    Use for clickable cards (dashboard tiles, menu items)
 *
 *  SHADOW SYSTEM
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  All shadows reference CSS variables from your globals.css.
 *  Dark mode inset amber rim, light mode warm amber-brown drops.
 *  Update --card-shadow-* once â†’ entire UI updates.
 *
 *  ZERO BREAKING CHANGES
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  All original sub-components (CardHeader, CardTitle, etc.)
 *  preserved 1-to-1. New variants are additive only.
 *
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD VARIANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const cardVariants = cva(
  [
    // base â€” layout & typography
    "group/card relative flex flex-col overflow-hidden rounded-lg",
    "text-xs/relaxed text-card-foreground",
    // image rounding
    "has-[>img:first-child]:pt-0",
    "*:[img:first-child]:rounded-t-lg",
    "*:[img:last-child]:rounded-b-lg",
  ].join(" "),
  {
    variants: {
      variant: {
        // â”€â”€ Standard elevated card
        // Amber inset rim on dark, warm drop on light
        default: [
          "bg-card",
          "ring-1 ring-foreground/10",
          "[box-shadow:var(--card-shadow,0_1px_3px_rgba(0,0,0,.1))]",
        ].join(" "),

        // â”€â”€ Ghost â€” border only, no fill
        // Great for secondary info panels, list wrappers
        ghost: [
          "bg-transparent",
          "ring-1 ring-foreground/10",
          "shadow-none",
        ].join(" "),

        // â”€â”€ Elevated â€” floats above the page
        // Use for modals, popovers, featured tiles
        elevated: [
          "bg-card",
          "ring-1 ring-foreground/10",
          "[box-shadow:var(--card-shadow-elevated,0_8px_24px_rgba(0,0,0,.15))]",
        ].join(" "),

        // â”€â”€ Filled â€” amber-tinted surface
        // Perfect for stat tiles, metric cards
        filled: [
          "bg-amber-50/60 dark:bg-amber-950/20",
          "ring-1 ring-amber-200/60 dark:ring-amber-800/30",
          "[box-shadow:var(--card-shadow-filled,0_1px_3px_rgba(133,79,11,.12))]",
        ].join(" "),

        // â”€â”€ Amber â€” full brand surface
        // Hero stat, primary action card, onboarding highlights
        amber: [
          "bg-[#EF9F27] text-[#412402]",
          "ring-1 ring-[#BA7517]/40",
          "[box-shadow:inset_0_1px_0_rgba(255,255,255,.20),inset_0_-1px_0_rgba(133,79,11,.30),0_4px_14px_-2px_rgba(133,79,11,.35)]",
        ].join(" "),

        // â”€â”€ Glass â€” frosted, semi-transparent
        // Drawers, sidebars, overlay panels
        glass: [
          "bg-background/60 dark:bg-card/40",
          "backdrop-blur-md",
          "ring-1 ring-foreground/8 dark:ring-white/8",
          "[box-shadow:var(--card-shadow-elevated,0_8px_24px_rgba(0,0,0,.12))]",
        ].join(" "),

        // â”€â”€ Flat â€” no shadow, no lift
        // Table rows, compact list items, dense UIs
        flat: [
          "bg-card",
          "ring-1 ring-foreground/8",
          "shadow-none",
        ].join(" "),
      },

      size: {
        sm: "gap-3 py-3",
        default: "gap-4 py-4",
        lg: "gap-5 py-5",
      },

      // Hover lift â€” opt-in for clickable tiles
      interactive: {
        true: [
          "cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-0.5",
          "hover:[box-shadow:var(--card-shadow-hover,0_8px_20px_rgba(0,0,0,.15))]",
          "active:translate-y-0 active:scale-[0.99]",
          "active:[box-shadow:var(--card-shadow,0_1px_3px_rgba(0,0,0,.1))]",
        ].join(" "),
        false: "",
      },
    },

    // Compound â€” elevated + interactive gets extra hover glow
    compoundVariants: [
      {
        variant: "elevated",
        interactive: true,
        className:
          "hover:[box-shadow:var(--card-shadow-elevated-hover,0_16px_32px_rgba(0,0,0,.20))]",
      },
      {
        variant: "filled",
        interactive: true,
        className:
          "hover:bg-amber-50/80 dark:hover:bg-amber-950/30 hover:[box-shadow:0_4px_16px_-2px_rgba(133,79,11,.22),0_0_0_2px_rgba(239,159,39,.12)]",
      },
      {
        variant: "amber",
        interactive: true,
        className:
          "hover:brightness-105 hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,.24),0_6px_20px_-2px_rgba(133,79,11,.45),0_0_0_3px_rgba(239,159,39,.18)]",
      },
      {
        variant: "ghost",
        interactive: true,
        className:
          "hover:bg-muted/40 dark:hover:bg-muted/20",
      },
    ],

    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface CardProps
  extends React.ComponentProps<"div">,
  VariantProps<typeof cardVariants> {
  /** Make the card respond to hover/active (clickable tiles) */
  interactive?: boolean
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function Card({
  className,
  variant = "default",
  size = "default",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(cardVariants({ variant, size, interactive }), className)}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD HEADER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // layout
        "group/card-header @container/card-header",
        "grid auto-rows-min items-start gap-1 rounded-t-lg",
        // padding â€” responds to parent size via data-size
        "px-4",
        "group-data-[size=sm]/card:px-3",
        "group-data-[size=lg]/card:px-5",
        // action column
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        // divider support
        "[.border-b]:pb-4",
        "group-data-[size=sm]/card:[.border-b]:pb-3",
        "group-data-[size=lg]/card:[.border-b]:pb-5",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD TITLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-sm font-medium leading-snug",
        // amber variant â€” title inherits the dark amber text
        "group-data-[variant=amber]/card:text-[#412402]",
        // filled variant â€” slightly warmer title
        "group-data-[variant=filled]/card:text-amber-900 dark:group-data-[variant=filled]/card:text-amber-100",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD DESCRIPTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-xs/relaxed text-muted-foreground",
        "group-data-[variant=amber]/card:text-[#633806]",
        "group-data-[variant=filled]/card:text-amber-700 dark:group-data-[variant=filled]/card:text-amber-300/80",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD ACTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD CONTENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-4",
        "group-data-[size=sm]/card:px-3",
        "group-data-[size=lg]/card:px-5",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD FOOTER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-lg",
        "px-4",
        "group-data-[size=sm]/card:px-3",
        "group-data-[size=lg]/card:px-5",
        "[.border-t]:pt-4",
        "group-data-[size=sm]/card:[.border-t]:pt-3",
        "group-data-[size=lg]/card:[.border-t]:pt-5",
        className
      )}
      {...props}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD STAT  â€” new compound sub-component
//  Opinionated layout for metric/KPI tiles
//  Usage:
//    <Card variant="filled" interactive>
//      <CardStat label="Revenue" value="â‚¨84.2k" trend="+12%" up />
//    </Card>
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface CardStatProps {
  label: string
  value: React.ReactNode
  trend?: string
  up?: boolean
  icon?: React.ReactNode
  className?: string
}

function CardStat({ label, value, trend, up, icon, className }: CardStatProps) {
  return (
    <div className={cn("flex flex-col gap-1 px-4 py-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground/60 [&_svg]:size-3.5">{icon}</span>
        )}
      </div>
      <div className="text-xl font-semibold tracking-tight leading-none">
        {value}
      </div>
      {trend && (
        <div
          className={cn(
            "text-[11px] font-medium",
            up
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive dark:text-destructive/80"
          )}
        >
          {up ? "â†‘" : "â†“"} {trend}
        </div>
      )}
    </div>
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CARD DIVIDER  â€” hairline separator between sections
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CardDivider({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        "border-none h-px mx-4",
        "bg-foreground/8 group-data-[variant=amber]/card:bg-[#BA7517]/20",
        "group-data-[size=sm]/card:mx-3",
        "group-data-[size=lg]/card:mx-5",
        className
      )}
    />
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  EXPORTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardStat,
  CardDivider,
  cardVariants,
}

export type { CardProps, CardStatProps }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  REQUIRED: add to globals.css
//  Update these â†’ every card in the product updates instantly
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
//  :root, [data-theme="light"] {
//    --card-shadow:
//      inset 0  1px 0   rgba(186,117,23, 0.20),
//      inset 0 -1px 0   rgba(133, 79,11, 0.08),
//      0 1px 3px 0      rgba(133, 79,11, 0.10),
//      0 1px 2px -1px   rgba(133, 79,11, 0.06);
//
//    --card-shadow-hover:
//      inset 0  1px 0   rgba(186,117,23, 0.26),
//      inset 0 -1px 0   rgba(133, 79,11, 0.12),
//      0 4px 14px -2px  rgba(133, 79,11, 0.18),
//      0 2px 6px -1px   rgba(133, 79,11, 0.10);
//
//    --card-shadow-elevated:
//      inset 0  1px 0   rgba(186,117,23, 0.22),
//      inset 0 -1px 0   rgba(133, 79,11, 0.10),
//      inset 1px 0 0    rgba(186,117,23, 0.08),
//      inset -1px 0 0   rgba(186,117,23, 0.08),
//      0 8px 24px -4px  rgba(133, 79,11, 0.22),
//      0 3px 8px -2px   rgba(133, 79,11, 0.12);
//
//    --card-shadow-elevated-hover:
//      inset 0  1px 0   rgba(186,117,23, 0.28),
//      inset 0 -1px 0   rgba(133, 79,11, 0.14),
//      inset 1px 0 0    rgba(186,117,23, 0.10),
//      inset -1px 0 0   rgba(186,117,23, 0.10),
//      0 16px 40px -6px rgba(133, 79,11, 0.28),
//      0 6px 14px -3px  rgba(133, 79,11, 0.16);
//
//    --card-shadow-filled:
//      inset 0  1px 0   rgba(255,255,255, 0.60),
//      inset 0 -1px 0   rgba(133, 79,11, 0.14),
//      0 2px 8px -1px   rgba(133, 79,11, 0.16);
//  }
//
//  .dark, [data-theme="dark"] {
//    --card-shadow:
//      inset 0  1px 0   rgba(239,159,39, 0.18),
//      inset 0 -1px 0   rgba(0,  0,  0,  0.35),
//      0 1px 3px 0      rgba(0,  0,  0,  0.50),
//      0 1px 2px -1px   rgba(0,  0,  0,  0.40);
//
//    --card-shadow-hover:
//      inset 0  1px 0   rgba(239,159,39, 0.22),
//      inset 0 -1px 0   rgba(0,  0,  0,  0.45),
//      0 4px 14px -2px  rgba(0,  0,  0,  0.55),
//      0 2px 6px -1px   rgba(239,159,39, 0.10);
//
//    --card-shadow-elevated:
//      inset 0  1px 0   rgba(239,159,39, 0.22),
//      inset 0 -1px 0   rgba(0,  0,  0,  0.45),
//      inset 1px 0 0    rgba(239,159,39, 0.10),
//      inset -1px 0 0   rgba(239,159,39, 0.10),
//      0 8px 24px -4px  rgba(0,  0,  0,  0.65),
//      0 3px 8px -2px   rgba(239,159,39, 0.12);
//
//    --card-shadow-elevated-hover:
//      inset 0  1px 0   rgba(239,159,39, 0.28),
//      inset 0 -1px 0   rgba(0,  0,  0,  0.55),
//      inset 1px 0 0    rgba(239,159,39, 0.14),
//      inset -1px 0 0   rgba(239,159,39, 0.14),
//      0 16px 40px -6px rgba(0,  0,  0,  0.75),
//      0 6px 14px -3px  rgba(239,159,39, 0.20);
//
//    --card-shadow-filled:
//      inset 0  1px 0   rgba(239,159,39, 0.20),
//      inset 0 -1px 0   rgba(0,  0,  0,  0.30),
//      0 2px 8px -1px   rgba(0,  0,  0,  0.40);
//  }
//
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  USAGE EXAMPLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
// â”€â”€ Standard card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card>
//   <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
//   <CardContent>â€¦</CardContent>
// </Card>
//
// â”€â”€ Stat tile (clickable, filled) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card variant="filled" interactive>
//   <CardStat label="Revenue" value="â‚¨84.2k" trend="12% vs last month" up />
// </Card>
//
// â”€â”€ Featured amber card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card variant="amber">
//   <CardHeader>
//     <CardTitle>Upgrade to Enterprise</CardTitle>
//     <CardDescription>Unlock unlimited branches</CardDescription>
//   </CardHeader>
//   <CardFooter><Button>Upgrade now</Button></CardFooter>
// </Card>
//
// â”€â”€ Glass panel (sidebar / drawer) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card variant="glass" size="lg">
//   <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
//   <CardDivider />
//   <CardContent>â€¦</CardContent>
// </Card>
//
// â”€â”€ Flat (table row wrapper) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card variant="flat" size="sm">
//   <CardContent>â€¦</CardContent>
// </Card>
//
// â”€â”€ Elevated modal card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// <Card variant="elevated">
//   <CardHeader>
//     <CardTitle>New Branch</CardTitle>
//     <CardAction><Button size="icon" variant="ghost"><X /></Button></CardAction>
//   </CardHeader>
//   <CardDivider />
//   <CardContent>â€¦</CardContent>
//   <CardFooter className="border-t">
//     <Button>Create</Button>
//   </CardFooter>
// </Card>