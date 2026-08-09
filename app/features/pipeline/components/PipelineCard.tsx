import Link from "next/link";
import {
  CalendarDays,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
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

  const isWholesaleAssignment =
    card.transactionType === "wholesale_assignment";

  const isSale =
    card.transactionType === "sale";

  const displayValue =
    card.pipelineValue ?? card.purchasePrice ?? 0;

  return (
    <Link
      href={`/transactions/${card.id}`}
      className="block rounded-xl border border-[#EDE7DC] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-snug text-[#29231D]">
            {card.transactionName}
          </h3>

          {card.transactionType && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8F8578]">
              {isWholesaleAssignment
                ? "Wholesale Assignment"
                : isSale
                  ? "Sale"
                  : card.transactionType.replaceAll(
                      "_",
                      " ",
                    )}
            </p>
          )}
        </div>

        <span
          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
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

      {/* Financial Value */}
      <div className="mt-4 rounded-xl bg-[#FBF7EF] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#B7832F]" />

            <span className="text-xs font-medium text-[#7C7265]">
              {isWholesaleAssignment
                ? "Pipeline Value"
                : isSale
                  ? "Sale Value"
                  : "Pipeline Value"}
            </span>
          </div>

          <span className="font-semibold text-[#B7832F]">
            ${displayValue.toLocaleString()}
          </span>
        </div>

        {/* Wholesale Assignment Fee / Sub-Metric */}
        {isWholesaleAssignment &&
          card.assignmentFee !== null &&
          card.assignmentFee !== undefined && (
            <div className="mt-2 flex items-center justify-between border-t border-[#E3DCD0] pt-2">
              <span className="text-xs text-[#8F8578]">
                Assignment Fee
              </span>

              <span className="text-sm font-semibold text-[#29231D]">
                $
                {Number(
                  card.assignmentFee,
                ).toLocaleString()}
              </span>
            </div>
          )}

        {/* Purchase Price for Wholesale / Secondary Metric */}
        {isWholesaleAssignment &&
          card.purchasePrice !== null &&
          card.purchasePrice !== undefined && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-[#8F8578]">
                Purchase Price
              </span>

              <span className="text-xs text-[#7C7265]">
                $
                {Number(
                  card.purchasePrice,
                ).toLocaleString()}
              </span>
            </div>
          )}

        {/* Sale Price */}
        {isSale &&
          card.salePrice !== null &&
          card.salePrice !== undefined && (
            <div className="mt-2 flex items-center justify-between border-t border-[#E3DCD0] pt-2">
              <span className="text-xs text-[#8F8578]">
                Sale Price
              </span>

              <span className="text-sm font-semibold text-[#29231D]">
                $
                {Number(
                  card.salePrice,
                ).toLocaleString()}
              </span>
            </div>
          )}

        {/* Generic/Fallback Sub-metric Box to maintain identical layout for other card types */}
        {!isWholesaleAssignment &&
          !isSale &&
          card.purchasePrice !== null &&
          card.purchasePrice !== undefined && (
            <div className="mt-2 flex items-center justify-between border-t border-[#E3DCD0] pt-2">
              <span className="text-xs text-[#8F8578]">
                Purchase Price
              </span>

              <span className="text-sm font-semibold text-[#29231D]">
                $
                {Number(
                  card.purchasePrice,
                ).toLocaleString()}
              </span>
            </div>
          )}
      </div>

      {/* Workflow Progress */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-[#7C7265]">
            Workflow
          </span>

          <span className="font-medium text-[#29231D]">
            {card.workflowPercent}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#ECE6DB]">
          <div
            className="h-full rounded-full bg-[#B7832F] transition-all"
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
          <AlertTriangle className="h-4 w-4" />

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