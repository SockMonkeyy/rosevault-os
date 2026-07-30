"use client";

import { useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

import { toggleChecklistItem } from "@/app/actions/transactions/toggleChecklistItem";

interface ChecklistItemProps {
  id: string;
  title: string;
  completed: boolean;
  autoCompleted: boolean;
  transactionId: string;
}

export default function ChecklistItem({
  id,
  title,
  completed,
  autoCompleted,
  transactionId,
}: ChecklistItemProps) {
  const [isPending, startTransition] =
    useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleChecklistItem(
        id,
        !completed,
        transactionId,
      );
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-xl border border-[#F1ECE3] p-3 text-left transition hover:bg-[#FBF7EF]"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#B7832F]" />
      ) : completed ? (
        <CheckCircle2 className="h-5 w-5 text-[#B7832F]" />
      ) : (
        <Circle className="h-5 w-5 text-[#D3C7B8]" />
      )}

      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            completed
              ? "text-[#7C7265] line-through"
              : "text-[#29231D]"
          }`}
        >
          {title}
        </p>

        {autoCompleted && (
          <p className="mt-1 text-xs text-[#8F8578]">
            Automatic
          </p>
        )}
      </div>
    </button>
  );
}