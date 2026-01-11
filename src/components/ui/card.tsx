import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border-border shadow-sm",
        elevated: "bg-card border-border/50 shadow-lg hover:shadow-xl",
        outlined: "bg-card border-2 border-primary/20 shadow-none",
        ghost: "bg-transparent border-transparent shadow-none",
        glass: "bg-card/80 backdrop-blur-xl border-border/50 shadow-lg",
        interactive: "bg-card border-border shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 active:translate-y-0",
        gradient: "bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 shadow-md",
        muted: "bg-muted/50 border-muted shadow-none",
        success: "bg-success/5 border-success/20 shadow-sm",
        warning: "bg-warning/5 border-warning/20 shadow-sm",
        destructive: "bg-destructive/5 border-destructive/20 shadow-sm",
      },
      padding: {
        none: "",
        sm: "[&>*:not(.card-header):not(.card-footer)]:p-4",
        default: "",
        lg: "[&>*:not(.card-header):not(.card-footer)]:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-header flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
