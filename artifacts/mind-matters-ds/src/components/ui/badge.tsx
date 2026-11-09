import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * The Brightside Project Badge
 *
 * Pill-shaped status / category chips in earthy palette colors.
 * All variants use rounded-full to match the organic wellness aesthetic.
 *
 * Variants:
 *   default     — terracotta fill (primary)
 *   secondary   — sage green fill (secondary)
 *   accent      — amber fill (accent)
 *   muted       — dusty rose fill (muted) with foreground text
 *   outline     — transparent with a faint border
 *   destructive — brick red for error / alert states
 *
 * Source: artifacts/mind-matters/src/pages/Review.tsx:164
 */
const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        accent:
          "border-transparent bg-accent text-accent-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        outline:
          "text-foreground border [border-color:var(--badge-outline)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
