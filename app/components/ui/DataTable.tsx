import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function DataTable({
  children,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E3DCD0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}