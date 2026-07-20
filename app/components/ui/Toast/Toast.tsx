import clsx from "clsx";

export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const variants = {
  success:
    "border-green-200 bg-green-50 text-green-900",

  error:
    "border-red-200 bg-red-50 text-red-900",

  warning:
    "border-yellow-200 bg-yellow-50 text-yellow-900",

  info:
    "border-blue-200 bg-blue-50 text-blue-900",
};

export default function Toast({
  title,
  description,
  variant = "success",
}: ToastProps) {
  return (
    <div
      className={clsx(
        "w-96 rounded-xl border p-4 shadow-lg",
        variants[variant]
      )}
    >
      <h3 className="font-semibold">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-sm opacity-80">
          {description}
        </p>
      )}
    </div>
  );
}