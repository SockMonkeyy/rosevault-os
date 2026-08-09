import { ReactNode } from "react";
import Link from "next/link";

interface WorkspaceHeaderProps {
  backHref?: string;
  backLabel?: string;

  title: string;
  description?: string;

  actions?: ReactNode;
}

export default function WorkspaceHeader({
  backHref,
  backLabel,
  title,
  description,
  actions,
}: WorkspaceHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="text-sm font-medium text-[#B7832F] transition hover:underline"
          >
            ← {backLabel ?? "Back"}
          </Link>
        )}

        <h1 className="mt-3 font-serif text-4xl text-[#29231D]">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-[#7C7265]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}