import {
  CheckCircle2,
  Circle,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  item_id: string;
  title: string;
  completed: boolean;
  auto_completed: boolean;
}

interface TransactionChecklistProps {
  items: ChecklistItem[];
}

export default function TransactionChecklist({
  items,
}: TransactionChecklistProps) {
  const completedCount = items.filter(
    (item) => item.completed,
  ).length;

  return (
    <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg text-[#29231D]">
            Checklist
          </h2>

          <p className="mt-1 text-sm text-[#8F8578]">
            {completedCount} of {items.length} complete
          </p>
        </div>

        <span className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#B7832F]">
          {Math.round(
            items.length === 0
              ? 0
              : (completedCount / items.length) *
                  100,
          )}
          %
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-[#F1ECE3] p-3"
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-[#B7832F]" />
            ) : (
              <Circle className="h-5 w-5 text-[#D3C7B8]" />
            )}

            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  item.completed
                    ? "text-[#7C7265] line-through"
                    : "text-[#29231D]"
                }`}
              >
                {item.title}
              </p>

              {item.auto_completed && (
                <p className="mt-1 text-xs text-[#8F8578]">
                  Automatic
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}