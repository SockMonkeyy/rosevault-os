interface TransactionNote {
  id: string;
  note: string;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TransactionNotesProps {
  notes: TransactionNote[];
}

export default function TransactionNotes({
  notes,
}: TransactionNotesProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-[#7C7265]">
        No notes yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((item) => {
        const userName = item.user
          ? `${item.user.first_name ?? ""} ${item.user.last_name ?? ""}`.trim()
          : "";

        return (
          <div
            key={item.id}
            className="rounded-xl border border-[#EDE7DC] bg-[#FBF7EF] p-4"
          >
            <p className="whitespace-pre-wrap text-sm text-[#29231D]">
              {item.note}
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-[#8F8578]">
              {userName && (
                <>
                  <span className="font-medium text-[#29231D]">{userName}</span>
                  <span>•</span>
                </>
              )}
              <span>{new Date(item.created_at).toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}