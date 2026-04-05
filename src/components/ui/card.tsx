import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/60 shadow-soft hover:border-border/80 hover:shadow-medium",
        elevated: "bg-card border border-border/40 shadow-medium hover:shadow-lg",
        outlined: "bg-card border-2 border-primary/15 shadow-none hover:border-primary/30",
        ghost: "bg-transparent border-transparent shadow-none",
        glass: "glass shadow-medium hover:shadow-lg",
        interactive: "bg-card border border-border/60 shadow-soft cursor-pointer hover:shadow-medium hover:border-primary/30 active:scale-[0.99]",
        muted: "bg-muted/40 border border-border/30 shadow-none",
        success: "bg-success/5 border border-success/20 shadow-none hover:border-success/35",
        warning: "bg-warning/5 border border-warning/20 shadow-none hover:border-warning/35",
        destructive: "bg-destructive/5 border border-destructive/20 shadow-none hover:border-destructive/35",
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
    <div ref={ref} className={cn("card-header flex flex-col space-y-1.5 p-5", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />
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
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-5 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
