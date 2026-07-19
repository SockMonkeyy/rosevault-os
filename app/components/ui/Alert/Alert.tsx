import { ReactNode } from "react";
import clsx from "clsx";

type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "danger";

interface AlertProps {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
}

const variants = {
  info: {
    container:
      "border-blue-200 bg-blue-50",
    title:
      "text-blue-900",
    body:
      "text-blue-700",
  },

  success: {
    container:
      "border-green-200 bg-green-50",
    title:
      "text-green-900",
    body:
      "text-green-700",
  },

  warning: {
    container:
      "border-yellow-200 bg-yellow-50",
    title:
      "text-yellow-900",
    body:
      "text-yellow-700",
  },

  danger: {
    container:
      "border-red-200 bg-red-50",
    title:
      "text-red-900",
    body:
      "text-red-700",
  },
};

export default function Alert({
  title,
  children,
  variant = "info",
}: AlertProps) {
  const style = variants[variant];

  return (
    <div
      className={clsx(
        "rounded-xl border p-5",
        style.container
      )}
    >
      {title && (
        <h3
          className={clsx(
            "mb-2 font-semibold",
            style.title
          )}
        >
          {title}
        </h3>
      )}

      <div
        className={clsx(
          "text-sm leading-6",
          style.body
        )}
      >
        {children}
      </div>
    </div>
  );
}