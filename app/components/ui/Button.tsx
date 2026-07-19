import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0D0C0A] text-[#D8B66A] hover:bg-[#171512] border border-[#29231D]",

  secondary:
    "bg-white text-[#29231D] border border-[#E3DCD0] hover:bg-[#FBF7EF]",

  outline:
    "border border-[#B7832F] text-[#B7832F] hover:bg-[#FBF7EF]",

  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || props.disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition duration-300 disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  )
);

Button.displayName = "Button";

export default Button;