import { ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[#E3DCD0] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
            {title}
          </p>

          <h2 className="mt-3 font-serif text-4xl text-[#29231D]">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-[#7C7265]">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="rounded-xl bg-[#FBF7EF] p-3">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-6 border-t border-[#EDE7DC] pt-4">
          {trend}
        </div>
      )}
    </div>
  );
}