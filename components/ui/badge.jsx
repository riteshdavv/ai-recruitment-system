import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1.5 transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-sage-100 text-sage-800 border border-sage-200",
        secondary:
          "bg-sage-100 text-sage-900 border border-sage-200",
        success:
          "bg-success-soft text-success border border-success/20",
        warning:
          "bg-warning-soft text-warning border border-warning/20",
        danger:
          "bg-danger-soft text-danger border border-danger/20",
        destructive:
          "bg-danger-soft text-danger border border-danger/20",
        info:
          "bg-info-soft text-info border border-info/20",
        outline:
          "border border-line bg-surface text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
