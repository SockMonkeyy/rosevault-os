import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            {eyebrow}
          </p>
        )}

        <h1 className="font-serif text-4xl text-[#29231D]">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-3xl text-[#7C7265]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}