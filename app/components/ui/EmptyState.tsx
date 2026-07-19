import { ReactNode } from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#E3DCD0] bg-white p-12 text-center shadow-sm">
      {icon && (
        <div className="mb-6 flex justify-center text-5xl">
          {icon}
        </div>
      )}

      <h2 className="font-serif text-3xl text-[#29231D]">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#7C7265]">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-8">
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}