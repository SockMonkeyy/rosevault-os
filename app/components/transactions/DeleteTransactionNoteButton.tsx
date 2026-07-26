"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTransactionNote } from "@/app/actions/transactions/deleteTransactionNote";

interface DeleteTransactionNoteButtonProps {
  noteId: string;
  transactionId: string;
}

export default function DeleteTransactionNoteButton({
  noteId,
  transactionId,
}: DeleteTransactionNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    console.log("Deleting note...", { noteId, transactionId });
    try {
      setDeleting(true);

      await deleteTransactionNote({
        noteId,
        transactionId,
      });

      toast.success("Note deleted.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete note.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
        title="Delete Note"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-serif text-xl text-[#29231D]">Delete Note</h2>

            <p className="mt-3 text-sm text-[#7C7265]">
              Are you sure you want to permanently delete this note?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#E3DCD0] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
