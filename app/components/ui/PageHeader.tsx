import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8F8578] transition hover:text-[#29231D]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel ?? "Back"}
        </Link>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#29231D]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}