import { ReactNode } from "react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export default function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#29231D]/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "w-full overflow-hidden rounded-2xl border border-[#EDE7DC] bg-[#FDFBF7] shadow-2xl",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EDE7DC] p-6">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#29231D]">
              {title}
            </h2>

            {description && (
              <p className="mt-2 text-sm text-[#7C7265]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg text-2xl leading-none text-[#8F8578] transition-colors hover:text-[#29231D]"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 text-[#29231D]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[#EDE7DC] bg-[#FBF7EF] p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}