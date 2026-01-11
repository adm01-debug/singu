import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================
// TYPOGRAPHY COMPONENTS - Pilar 2.1, 2.2, 2.3
// ============================================

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  gradient?: boolean;
}

// Display - Hero sections (48-60px)
export const Display = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, gradient, children, as: Component = "h1", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight",
        "leading-[1.1]",
        gradient && "bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Display.displayName = "Display";

// Heading 1 - Page titles (36px)
export const H1 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, gradient, children, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(
        "text-3xl md:text-4xl font-bold tracking-tight",
        "leading-tight",
        gradient && "bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
);
H1.displayName = "H1";

// Heading 2 - Section titles (30px)
export const H2 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, gradient, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-2xl md:text-3xl font-semibold tracking-tight",
        "leading-snug",
        gradient && "bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
);
H2.displayName = "H2";

// Heading 3 - Card titles (24px)
export const H3 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, gradient, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl md:text-2xl font-semibold",
        "leading-snug",
        gradient && "bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);
H3.displayName = "H3";

// Heading 4 - Subsections (20px)
export const H4 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn(
        "text-lg md:text-xl font-medium",
        "leading-normal",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  )
);
H4.displayName = "H4";

// Lead - Intro paragraphs (18px)
export const Lead = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, as: Component = "p", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-lg text-muted-foreground",
        "leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Lead.displayName = "Lead";

// Body - Default text (16px)
export const Body = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, as: Component = "p", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-base",
        "leading-normal",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Body.displayName = "Body";

// Small - Secondary text (14px)
export const Small = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, as: Component = "p", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        "leading-normal",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Small.displayName = "Small";

// Caption - Labels, metadata (12px)
export const Caption = React.forwardRef<HTMLSpanElement, TypographyProps>(
  ({ className, children, as: Component = "span", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xs text-muted-foreground uppercase tracking-wide font-medium",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Caption.displayName = "Caption";

// Eyebrow - Category labels (12px)
export const Eyebrow = React.forwardRef<HTMLSpanElement, TypographyProps>(
  ({ className, children, as: Component = "span", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xs uppercase tracking-widest font-semibold text-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Eyebrow.displayName = "Eyebrow";

// Muted text
export const Muted = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, as: Component = "p", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);
Muted.displayName = "Muted";

// Inline code
export const InlineCode = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium",
        className
      )}
      {...props}
    >
      {children}
    </code>
  )
);
InlineCode.displayName = "InlineCode";

// Blockquote
export const Blockquote = React.forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        "mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
);
Blockquote.displayName = "Blockquote";

// List
export const List = React.forwardRef<HTMLUListElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2",
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
);
List.displayName = "List";

// Gradient text wrapper
export const GradientText = React.forwardRef<HTMLSpanElement, TypographyProps & { 
  from?: string;
  to?: string;
}>(
  ({ className, children, from = "from-foreground", to = "to-primary", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        from,
        to,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
GradientText.displayName = "GradientText";
