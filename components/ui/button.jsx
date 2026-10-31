import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sage-700 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-sage-700 text-white hover:bg-sage-800 shadow-xs active:bg-sage-800",
        destructive:
          "bg-danger text-white hover:bg-danger/90 shadow-xs focus-visible:ring-danger",
        outline:
          "border border-line bg-surface text-ink hover:bg-sage-100 shadow-xs",
        secondary:
          "border border-line bg-surface text-ink hover:bg-sage-100 shadow-xs",
        ghost:
          "text-ink hover:bg-sage-100",
        link:
          "text-sage-700 underline-offset-4 hover:underline hover:text-sage-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
