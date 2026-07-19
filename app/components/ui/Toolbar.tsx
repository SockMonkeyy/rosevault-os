import { ReactNode } from "react";

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
}

export default function Toolbar({
  left,
  right,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E3DCD0] bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div>{left}</div>

      <div className="flex items-center gap-3">
        {right}
      </div>
    </div>
  );
}