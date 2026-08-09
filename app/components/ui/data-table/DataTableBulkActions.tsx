"use client";

import { DataTableBulkAction } from "@/lib/table/types";

interface Props<T> {
  selectedCount: number;
  selectedRows: T[];
  actions: DataTableBulkAction<T>[];
  onClear: () => void;
}

export default function DataTableBulkActions<T>({
  selectedCount,
  selectedRows,
  actions,
  onClear,
}: Props<T>) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-b border-[#EDE7DC] bg-[#FBF7EF] px-6 py-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#29231D]">
          {selectedCount} selected
        </span>

        <button
          onClick={onClear}
          className="text-sm text-[#B7832F] hover:underline"
        >
          Clear Selection
        </button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => action.onClick(selectedRows)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              action.variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#0D0C0A] text-[#D8B66A] hover:bg-[#29231D]"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}