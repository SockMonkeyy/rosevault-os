"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateTransactionNote } from "@/app/actions/transactions/updateTransactionNote";
import { useRouter } from "next/navigation";

interface EditTransactionNoteButtonProps {
  noteId: string;
  transactionId: string;
  note: string;
}

export default function EditTransactionNoteButton({
  noteId,
  transactionId,
  note,
}: EditTransactionNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState(note);

  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!noteText.trim()) {
      toast.error("Note cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      await updateTransactionNote({
        noteId,
        transactionId,
        note: noteText.trim(),
      });

      toast.success("Note updated.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-[#8F8578] transition hover:bg-[#FBF7EF] hover:text-[#29231D]"
        title="Edit Note"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-serif text-xl text-[#29231D]">Edit Note</h2>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-[#29231D]">
                Note
              </label>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-[#E3DCD0] bg-white px-4 py-3 text-sm text-[#29231D] outline-none transition focus:border-[#B7832F] focus:ring-2 focus:ring-[#D8B66A]/30"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#E3DCD0] px-4 py-2 text-sm font-medium text-[#29231D] transition hover:bg-[#F5EEDF]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#0D0C0A] px-4 py-2 text-sm font-medium text-[#D8B66A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
