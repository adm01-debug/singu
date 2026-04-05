import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "nexus-card rounded-2xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card/88 border-border/70 shadow-[0_18px_40px_-28px_hsl(var(--foreground)/0.45)] hover:border-primary/30 hover:shadow-[0_24px_55px_-28px_hsl(var(--nexus-glow)/0.35)]",
        elevated: "bg-card/94 border-border/80 shadow-[0_24px_60px_-30px_hsl(var(--foreground)/0.5)] hover:border-primary/35 hover:shadow-[0_28px_70px_-32px_hsl(var(--nexus-glow)/0.4)]",
        outlined: "bg-card/88 border border-primary/25 shadow-[0_16px_36px_-28px_hsl(var(--foreground)/0.35)] hover:border-primary/45",
        ghost: "bg-transparent border-transparent shadow-none",
        glass: "nexus-glass shadow-[0_24px_60px_-34px_hsl(var(--nexus-glow)/0.25)] hover:border-primary/30",
        interactive: "bg-card/90 border border-border/70 shadow-[0_18px_40px_-28px_hsl(var(--foreground)/0.42)] cursor-pointer hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_55px_-30px_hsl(var(--nexus-glow)/0.35)] active:scale-[0.99]",
        muted: "bg-muted/30 border border-border/60 shadow-none",
        success: "bg-success/8 border border-success/25 shadow-[0_18px_36px_-30px_hsl(var(--success)/0.25)] hover:border-success/45",
        warning: "bg-warning/8 border border-warning/25 shadow-[0_18px_36px_-30px_hsl(var(--warning)/0.25)] hover:border-warning/45",
        destructive: "bg-destructive/8 border border-destructive/25 shadow-[0_18px_36px_-30px_hsl(var(--destructive)/0.25)] hover:border-destructive/45",
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
    <div ref={ref} className={cn("card-header flex flex-col space-y-1.5 p-5 md:p-6", className)} {...props} />
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
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0 md:p-6 md:pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-5 pt-0 md:p-6 md:pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
