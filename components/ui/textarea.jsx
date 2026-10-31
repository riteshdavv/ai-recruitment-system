import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[96px] w-full rounded-md border border-line bg-surface p-3.5 text-sm text-ink placeholder:text-ink-subtle outline-none transition-colors",
        "focus-visible:border-sage-700 focus-visible:ring-3 focus-visible:ring-sage-700/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
