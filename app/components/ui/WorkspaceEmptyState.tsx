import { ReactNode } from "react";

interface WorkspaceEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
}: WorkspaceEmptyStateProps) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#EDE7DC] bg-white/70 p-10 shadow-sm backdrop-blur-sm">
      <div className="max-w-lg text-center">
        {icon && (
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D8B66A]/30 bg-[#FBF7EF]">
            {icon}
          </div>
        )}

        <h2 className="font-serif text-2xl text-[#29231D]">
          {title}
        </h2>

        <p className="mt-3 leading-7 text-[#7C7265]">
          {description}
        </p>

        {action && (
          <div className="mt-8">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}