"use client";

import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearch: (value: string) => void;
  children?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export default function DataTableToolbar({
  search,
  onSearch,
  children,
  rightActions,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[#EDE7DC] p-4">
      <div className="relative w-80">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#8F8578]" />

        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-xl border border-[#EDE7DC] py-2 pl-10 pr-4 outline-none focus:border-[#B7832F]"
        />
      </div>

      <div className="flex items-center gap-3">
        {children}

        {rightActions}
      </div>
    </div>
  );
}