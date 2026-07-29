import { CheckCircle2, Circle, Clock3 } from "lucide-react";

import {
  TRANSACTION_MILESTONES,
  TransactionMilestoneKey,
} from "@/lib/transactions/milestones";

interface TransactionTimelineProps {
  currentMilestone: TransactionMilestoneKey;
}

export default function TransactionTimeline({
  currentMilestone,
}: TransactionTimelineProps) {
  const currentIndex = TRANSACTION_MILESTONES.findIndex(
    (m) => m.key === currentMilestone,
  );

  return (
    <div className="rounded-2xl border border-[#EDE7DC] bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl text-[#29231D]">
        Transaction Progress
      </h2>

      <p className="mt-1 text-sm text-[#7C7265]">
        Follow the progress of this transaction from lead to closing.
      </p>

      <div className="mt-8 space-y-6">
        {TRANSACTION_MILESTONES.map((milestone, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;
          const upcoming = index > currentIndex;

          return (
            <div
              key={milestone.key}
              className={`rounded-xl border p-3 transition-all ${
                current
                  ? "border-[#D8B66A] bg-[#FBF7EF] shadow-sm"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative flex flex-col items-center">
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 z-10 bg-white" />
                  ) : current ? (
                    <Clock3 className="h-6 w-6 text-[#B7832F] z-10 bg-white" />
                  ) : (
                    <Circle className="h-6 w-6 text-[#CFC5B8] z-10 bg-white" />
                  )}

                  {index < TRANSACTION_MILESTONES.length - 1 && (
                    <div
                      className={`mt-1 h-10 w-px ${
                        completed ? "bg-green-500" : "bg-[#E3DCD0]"
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      current
                        ? "text-[#29231D]"
                        : completed
                          ? "text-[#29231D]"
                          : "text-[#8F8578]"
                    }`}
                  >
                    {milestone.title}
                  </h3>

                  <div className="mt-2">
                    {completed && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Complete
                      </span>
                    )}

                    {current && (
                      <span className="rounded-full bg-[#F4E5C2] px-2 py-1 text-xs font-medium text-[#8A6116]">
                        Current
                      </span>
                    )}

                    {upcoming && (
                      <span className="rounded-full bg-[#F5F2EC] px-2 py-1 text-xs font-medium text-[#8F8578]">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[#7C7265]">
                    {milestone.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
