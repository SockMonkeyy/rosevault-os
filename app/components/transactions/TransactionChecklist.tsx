import ChecklistItem from "./ChecklistItem";

interface ChecklistRow {
  id: string;
  item_id: string;
  title: string;
  completed: boolean;
  auto_completed: boolean;
}

interface TransactionChecklistProps {
  transactionId: string;
  items: ChecklistRow[];
}

export default function TransactionChecklist({
  transactionId,
  items,
}: TransactionChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-[#29231D]">
            Workflow Checklist
          </h2>

          <p className="mt-1 text-sm text-[#8F8578]">
            Complete every task before advancing to the next workflow stage.
          </p>
        </div>

        <span className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#B7832F]">
          {Math.round(
            items.length === 0 ? 0 : (completedCount / items.length) * 100,
          )}
          %
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E3DCD0] bg-[#FBF7EF] p-5 text-center">
            <p className="text-sm text-[#8F8578]">
              No checklist items for this stage.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              title={item.title}
              completed={item.completed}
              autoCompleted={item.auto_completed}
              transactionId={transactionId}
            />
          ))
        )}
      </div>
    </div>
  );
}
