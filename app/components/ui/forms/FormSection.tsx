import { ReactNode } from "react";

interface FormSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-[#E3DCD0] bg-[#FBF7EF] p-8 shadow-sm ${className}`}
    >
      <div className="mb-8">
        {eyebrow && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.20em] text-[#B7832F]">
            {eyebrow}
          </p>
        )}

        <h2 className="font-serif text-2xl text-[#29231D]">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm text-[#7C7265]">
            {description}
          </p>
        )}
      </div>

      <div className="grid gap-6">
        {children}
      </div>
    </section>
  );
}