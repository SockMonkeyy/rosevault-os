import Link from "next/link";
import {
  CalendarDays,
  DollarSign,
  ClipboardCheck,
  CheckCircle2,
  Folder,
} from "lucide-react";

import { PipelineCard as Card } from "../types";

interface Props {
  card: Card;
}

export default function PipelineCard({
  card,
}: Props) {
  const healthColor = {
    healthy: "bg-green-500",
    good: "bg-[#B7832F]",
    warning: "bg-yellow-500",
    attention: "bg-red-500",
  };

  return (
    <Link
      href={`/transactions/${card.id}`}
      className="block rounded-xl border border-[#EDE7DC] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[#29231D] leading-snug">
          {card.transactionName}
        </h3>

        <span
          className={`h-3 w-3 rounded-full ${
            healthColor[card.workflowHealth]
          }`}
        />
      </div>

      {/* Address */}
      {card.propertyAddress && (
        <p className="mt-2 text-sm text-[#7C7265]">
          {card.propertyAddress}
        </p>
      )}

      {/* Purchase Price */}
      {card.purchasePrice && (
        <div className="mt-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#B7832F]" />
          <span className="font-semibold text-[#B7832F]">
            ${card.purchasePrice.toLocaleString()}
          </span>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-[#7C7265]">Workflow</span>
          <span className="font-medium text-[#29231D]">
            {card.workflowPercent}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#ECE6DB]">
          <div
            className="h-full rounded-full bg-[#B7832F]"
            style={{
              width: `${card.workflowPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-[#7C7265]">
        <div className="flex items-center gap-1">
          <ClipboardCheck className="h-4 w-4" />
          {card.checklistRemaining}
        </div>

        <div className="flex items-center gap-1">
          <Folder className="h-4 w-4" />
          {card.documentsRemaining}
        </div>

        {card.daysUntilClosing !== undefined ? (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {card.daysUntilClosing}d
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            —
          </div>
        )}
      </div>
    </Link>
  );
}