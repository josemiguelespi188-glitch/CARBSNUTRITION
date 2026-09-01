import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "accent";
type Size = "default" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:opacity-90",
  accent: "bg-accent-1 text-[#F3F3F1] hover:opacity-90",
  secondary: "bg-surface-2 text-ink hover:bg-line",
  outline: "border border-line text-ink hover:border-ink",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
};

const sizeClasses: Record<Size, string> = {
  default: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  sm: "h-9 px-4 text-xs",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide uppercase transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
