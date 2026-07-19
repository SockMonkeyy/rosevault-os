import { ReactNode } from "react";

interface Props {
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
}: Props) {
  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            {eyebrow}
          </p>
        )}

        <h1 className="font-serif text-4xl text-[#29231D]">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-[#756A5C]">
            {description}
          </p>
        )}
      </div>

      {actions}
    </div>
  );
}