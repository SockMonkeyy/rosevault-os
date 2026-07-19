import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[#E3DCD0] bg-white shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-[#EDE7DC] px-6 py-4">
          <div>
            {title && (
              <h2 className="font-serif text-xl text-[#29231D]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm text-[#8F8578]">
                {description}
              </p>
            )}
          </div>

          {actions}
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  );
}