import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // ทองสด + ตัวหนังสือน้ำตาลเข้ม (ไม่ใช่ตัวหนังสือขาว) — ได้โทนสว่างตามโลโก้ และยังอ่านชัด
  primary: "bg-brand-500 text-brand-900 hover:bg-brand-400",
  secondary: "bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  ghost: "text-gray-700 hover:bg-gray-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(base, variants[variant], sizes[size]);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

interface LinkButtonProps
  extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonClasses(variant, size), className)} {...props} />
  );
}
