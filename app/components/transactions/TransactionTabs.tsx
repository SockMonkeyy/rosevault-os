"use client";

import clsx from "clsx";

export type TransactionTab =
  | "overview"
  | "workflow"
  | "tasks"
  | "documents"
  | "timeline"
  | "financial"
  | "people";

interface Props {
  active: TransactionTab;
  onChange: (tab: TransactionTab) => void;
}

const tabs: {
  id: TransactionTab;
  label: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "workflow",
    label: "Workflow",
  },
  {
    id: "tasks",
    label: "Tasks",
  },
  {
    id: "documents",
    label: "Documents",
  },
  {
    id: "timeline",
    label: "Timeline",
  },
  {
    id: "financial",
    label: "Financial",
  },
  {
    id: "people",
    label: "People",
  },
];

export default function TransactionTabs({
  active,
  onChange,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 border-b border-[#EDE7DC]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "rounded-t-xl px-4 py-3 text-sm font-medium transition",
              active === tab.id
                ? "bg-white text-[#29231D] border border-[#EDE7DC] border-b-white"
                : "text-[#8F8578] hover:text-[#29231D]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}