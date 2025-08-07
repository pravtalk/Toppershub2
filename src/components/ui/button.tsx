import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 glow-primary",
        secondary: "gradient-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:scale-105 glow-secondary",
        accent: "gradient-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105",
        outline: "border-2 border-primary bg-transparent text-primary hover:gradient-primary hover:text-primary-foreground hover:scale-105",
        ghost: "bg-transparent text-foreground hover:bg-muted hover:text-foreground",
        card: "gradient-card text-card-foreground border border-border hover:border-primary/50 hover:scale-105",
        study: "bg-info text-white shadow-lg hover:shadow-xl hover:scale-105 font-bold",
        join: "bg-success text-white shadow-lg hover:shadow-xl hover:scale-105 font-bold animate-pulse",
        premium: "bg-warning text-black shadow-lg hover:shadow-xl hover:scale-105 font-bold",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
        wide: "h-12 px-12 w-full",
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
