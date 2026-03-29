"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "../lib/utils"
import { ChevronDown, Check, ChevronUp } from "lucide-react"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default"
  }
>(({ className, size = "default", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    data-size={size}
    className={cn(
      // layout
      "flex w-fit items-center justify-between gap-1.5 rounded-md",
      "px-2 py-1.5 text-xs/relaxed whitespace-nowrap",
      "transition-all duration-150 outline-none",
      // surface â€” same dark fill as Input
      "border border-input",
      "bg-input/20 dark:bg-[#161310]",
      // inner shadow â€” pressed-in, matches Input
      "[box-shadow:inset_0_1px_2px_rgba(0,0,0,.06)]",
      "dark:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.45),inset_0_0_0_1px_rgba(239,159,39,.04)]",
      // sizes
      "data-[size=default]:h-7 data-[size=sm]:h-6",
      // placeholder
      "data-[placeholder]:text-muted-foreground",
      // focus
      "focus-visible:border-[#EF9F27]/60 dark:focus-visible:border-[#EF9F27]/50",
      "focus-visible:ring-2 focus-visible:ring-[#EF9F27]/20",
      "focus-visible:[box-shadow:inset_0_1px_2px_rgba(0,0,0,.06),0_0_0_3px_rgba(239,159,39,.10)]",
      "dark:focus-visible:[box-shadow:inset_0_1px_3px_rgba(0,0,0,.50),inset_0_0_0_1px_rgba(239,159,39,.10),0_0_0_3px_rgba(239,159,39,.08)]",
      // open state â€” amber border hint
      "data-[state=open]:border-[#EF9F27]/50 dark:data-[state=open]:border-[#EF9F27]/40",
      // disabled / invalid
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
      "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      // icon children
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className={cn(
          "pointer-events-none size-3.5 text-muted-foreground",
          "transition-transform duration-150"
        )}
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    data-slot="select-scroll-up-button"
    className={cn(
      "flex w-full cursor-default items-center justify-center",
      "bg-popover py-1",
      "text-muted-foreground hover:text-[#EF9F27]",
      "transition-colors duration-100",
      "[&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  >
    <ChevronUp />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    data-slot="select-scroll-down-button"
    className={cn(
      "flex w-full cursor-default items-center justify-center",
      "bg-popover py-1",
      "text-muted-foreground hover:text-[#EF9F27]",
      "transition-colors duration-100",
      "[&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  >
    <ChevronDown />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      data-slot="select-content"
      className={cn(
        // base
        "dark relative isolate z-50",
        "min-w-32 overflow-hidden",
        "rounded-lg",
        // surface â€” elevated card surface
        "bg-popover text-popover-foreground",
        // premium shadow â€” matches card-elevated
        "ring-1 ring-foreground/10",
        "[box-shadow:inset_0_1px_0_rgba(239,159,39,.18),inset_0_-1px_0_rgba(0,0,0,.35),inset_1px_0_0_rgba(239,159,39,.08),inset_-1px_0_0_rgba(239,159,39,.08),0_8px_24px_-4px_rgba(0,0,0,.60),0_3px_8px_-2px_rgba(239,159,39,.10)]",
        // animations
        "duration-100",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    data-slot="select-label"
    className={cn(
      "px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider",
      "text-muted-foreground/60",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    data-slot="select-item"
    className={cn(
      // layout
      "relative flex min-h-7 w-full cursor-default items-center gap-2",
      "rounded-md px-2 py-1 pr-8 text-xs/relaxed",
      "outline-hidden select-none",
      "transition-colors duration-100",
      // focus / hover â€” amber tinted highlight
      "focus:bg-[#EF9F27]/10 dark:focus:bg-[#EF9F27]/12",
      "focus:text-foreground",
      // disabled
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      // icons
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="pointer-events-none absolute right-2 flex items-center justify-center text-[#EF9F27]">
      <SelectPrimitive.ItemIndicator>
        <Check className="pointer-events-none size-3" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    data-slot="select-separator"
    className={cn(
      "pointer-events-none -mx-1 my-1 h-px",
      "bg-[#EF9F27]/10 dark:bg-[#EF9F27]/8",
      className
    )}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
