import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: Props) {
  return (
    <div className="rounded-xl border border-dashed border-[#E3DCD0] bg-white px-10 py-20 text-center">
      {icon && (
        <div className="mb-6 flex justify-center">
          {icon}
        </div>
      )}

      <h3 className="font-serif text-2xl text-[#29231D]">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-md text-[#756A5C]">
        {description}
      </p>

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}