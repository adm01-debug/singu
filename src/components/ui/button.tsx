import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // New gradient variants - Pilar 3.3
        gradient: "bg-gradient-to-r from-primary to-[hsl(250_83%_60%)] text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 shadow-md",
        "gradient-success": "bg-gradient-to-r from-[hsl(142_76%_36%)] to-[hsl(160_84%_39%)] text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 shadow-md",
        "gradient-warning": "bg-gradient-to-r from-[hsl(38_92%_50%)] to-[hsl(25_95%_53%)] text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 shadow-md",
        premium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5",
        success: "bg-[hsl(142_76%_36%)] text-white hover:bg-[hsl(142_76%_32%)] hover:shadow-md",
        warning: "bg-[hsl(38_92%_50%)] text-white hover:bg-[hsl(38_92%_45%)] hover:shadow-md",
        info: "bg-[hsl(199_89%_48%)] text-white hover:bg-[hsl(199_89%_43%)] hover:shadow-md",
        // Glass variant
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // New sizes - Pilar 9.1
        xs: "h-7 px-2 text-xs rounded",
        xl: "h-12 px-10 text-lg rounded-lg",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
