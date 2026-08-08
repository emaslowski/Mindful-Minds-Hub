import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * Mind Matters Button
 *
 * Default shape is pill (rounded-full) matching the wellness platform's
 * organic, soft aesthetic. All variants use the earthy token palette.
 *
 * Variants:
 *   default   — terracotta fill (#c4622d / primary) with cream text
 *   secondary — sage green fill (#688a52) with cream text
 *   outline   — transparent with sage border; terracotta on hover-elevate
 *   ghost     — transparent, foreground text, no border
 *   amber     — amber accent fill (#d4a44c) with chocolate text
 *   link      — terracotta underline text
 *   destructive — brick red fill
 *
 * Source: artifacts/mind-matters/src/pages/ (Connect.tsx:117, Review.tsx:118,
 * Listen.tsx:133-149, CheckIn.tsx:154)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border shadow-sm",
        outline:
          "border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground bg-transparent",
        ghost:
          "border border-transparent text-foreground bg-transparent",
        amber:
          "bg-accent text-accent-foreground border border-accent-border shadow-sm",
        link:
          "text-primary underline-offset-4 hover:underline border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border shadow-sm",
      },
      size: {
        default: "h-11 px-8 py-2.5 text-sm",
        sm:      "h-9 px-5 text-xs",
        lg:      "h-13 px-10 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
