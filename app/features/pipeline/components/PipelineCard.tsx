import { CalendarDays } from "lucide-react";

import { PipelineCard as Card } from "../types";

interface Props {
  card: Card;
}

export default function PipelineCard({
  card,
}: Props) {
  return (
    <div className="rounded-xl border border-[#EDE7DC] bg-white p-4 shadow-sm transition hover:shadow-md">
      <h3 className="font-medium text-[#29231D]">
        {card.transactionName}
      </h3>

      {card.propertyAddress && (
        <p className="mt-1 text-sm text-[#7C7265]">
          {card.propertyAddress}
        </p>
      )}

      {card.purchasePrice && (
        <p className="mt-3 font-semibold text-[#B7832F]">
          $
          {card.purchasePrice.toLocaleString()}
        </p>
      )}

      {card.closingDate && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#8F8578]">
          <CalendarDays className="h-4 w-4" />

          {new Date(
            card.closingDate,
          ).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}