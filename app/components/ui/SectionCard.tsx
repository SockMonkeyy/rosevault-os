import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[#EDE7DC] bg-white/70 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-[#EDE7DC] px-6 py-4">
          <div>
            <div className="flex items-start gap-3">
              {Icon && (
                <div className="mt-0.5 rounded-lg bg-[#FBF7EF] p-2">
                  <Icon className="h-5 w-5 text-[#B7832F]" />
                </div>
              )}

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
            </div>
          </div>

          {actions}
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  );
}