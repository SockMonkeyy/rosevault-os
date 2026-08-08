import PipelineCard from "./PipelineCard";
import { PipelineColumn as Column } from "../types";

interface Props {
  column: Column;
}

export default function PipelineColumn({
  column,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#EDE7DC] bg-[#FBF7EF] shadow-sm">
      {/* Header */}
      <div className="border-b border-[#EDE7DC] px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-base text-[#29231D] truncate">
            {column.title}
          </h2>

          <span className="shrink-0 rounded-full bg-[#0D0C0A] px-2 py-0.5 text-[11px] font-semibold text-[#D8B66A]">
            {column.totalDeals}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-[#8F8578]">
          $
          {column.totalValue.toLocaleString()}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 p-3 overflow-y-auto max-h-[calc(100vh-260px)]">
        {column.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8D2C8] bg-white/70 p-4 text-center">
            <p className="text-xs text-[#8F8578]">
              No transactions
            </p>
          </div>
        ) : (
          column.cards.map((card) => (
            <PipelineCard
              key={card.id}
              card={card}
            />
          ))
        )}
      </div>
    </div>
  );
}