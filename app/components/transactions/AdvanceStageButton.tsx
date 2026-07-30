"use client";

import { useTransition } from "react";

import { ArrowRight, Loader2 } from "lucide-react";

import { advanceTransactionStage } from "@/app/actions/transactions/advanceTransactionStage";

interface AdvanceStageButtonProps {
  transactionId: string;
  disabled: boolean;
}

export default function AdvanceStageButton({
  transactionId,
  disabled,
}: AdvanceStageButtonProps) {
  const [pending, startTransition] =
    useTransition();

  function handleClick() {
    startTransition(async () => {
      await advanceTransactionStage(
        transactionId,
      );
    });
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0C0A] px-4 py-3 text-sm font-semibold text-[#D8B66A] transition hover:bg-[#171512] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Advancing...
        </>
      ) : (
        <>
          Advance Stage
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}