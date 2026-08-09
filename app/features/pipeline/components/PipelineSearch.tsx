"use client";

import { Search } from "lucide-react";

interface PipelineSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PipelineSearch({
  value,
  onChange,
}: PipelineSearchProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder="Search transactions..."
        className="w-full rounded-xl border border-[#EDE7DC] bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#B7832F]"
      />
    </div>
  );
}