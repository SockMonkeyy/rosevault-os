import clsx from "clsx";

interface StatusBadgeProps {
  status: string | null | undefined;
}

const statusStyles = {
  lead: "bg-slate-100 text-slate-700 border-slate-200",
  offer_made: "bg-blue-50 text-blue-700 border-blue-200",
  under_contract: "bg-amber-50 text-amber-700 border-amber-200",
  due_diligence: "bg-purple-50 text-purple-700 border-purple-200",
  clear_to_close: "bg-indigo-50 text-indigo-700 border-indigo-200",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
} as const;

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className="rounded-full border border-[#EDE7DC] bg-[#FBF7EF] px-3 py-1 text-xs font-semibold text-[#8F8578]">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
        // ensure we only index statusStyles with its known keys
        statusStyles[status as keyof typeof statusStyles] ??
          "border-[#EDE7DC] bg-[#FBF7EF] text-[#7C7265]"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}