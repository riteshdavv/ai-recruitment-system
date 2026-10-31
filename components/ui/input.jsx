import * as React from "react"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-line bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none transition-colors",
        "focus-visible:border-sage-700 focus-visible:ring-3 focus-visible:ring-sage-700/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
