import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[#E3DCD0] bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function CardHeader({
  eyebrow,
  title,
  description,
  actions,
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-[#EDE7DC] p-6">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B7832F]">
            {eyebrow}
          </p>
        )}

        <h2 className="font-serif text-2xl text-[#29231D]">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-[#7C7265]">
            {description}
          </p>
        )}
      </div>

      {actions}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className,
}: CardContentProps) {
  return (
    <div className={clsx("p-6", className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
}

export function CardFooter({
  children,
}: CardFooterProps) {
  return (
    <div className="border-t border-[#EDE7DC] bg-[#FBF7EF] px-6 py-4">
      {children}
    </div>
  );
}