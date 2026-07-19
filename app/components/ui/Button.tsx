import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#0D0C0A] text-[#D8B66A] hover:bg-[#171512]",

    secondary:
      "bg-[#D8B66A] text-[#0D0C0A] hover:bg-[#C8A654]",

    outline:
      "border border-[#D8D2C8] bg-white text-[#29231D] hover:bg-[#F5EEDF]",

    danger:
      "bg-red-600 text-white hover:bg-red-700",

    ghost:
      "bg-transparent text-[#29231D] hover:bg-[#F5EEDF]",
  };

  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}