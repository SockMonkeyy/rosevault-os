import { ReactNode } from "react";

interface WorkspaceStat {
  label: string;
  value: ReactNode;
  subtitle?: string;
}

interface WorkspaceStatsProps {
  stats: WorkspaceStat[];
}

export default function WorkspaceStats({
  stats,
}: WorkspaceStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[#EDE7DC] bg-white/70 p-5 shadow-sm backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
            {stat.label}
          </p>

          <p className="mt-2 font-serif text-3xl text-[#29231D]">
            {stat.value}
          </p>

          {stat.subtitle && (
            <p className="mt-1 text-sm text-[#8F8578]">
              {stat.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}