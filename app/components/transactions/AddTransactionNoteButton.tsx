"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createTransactionNote } from "@/app/actions/transactions/createTransactionNote";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddTransactionNoteButtonProps {
  transactionId: string;
}

export default function AddTransactionNoteButton({
  transactionId,
}: AddTransactionNoteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Handle Escape key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setNoteText("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setIsSubmitting(true);
      await createTransactionNote(transactionId, noteText.trim());

      toast.success("Note saved successfully.");

      setNoteText("");
      setIsOpen(false);

      router.refresh(); // Forces Next.js to re-fetch Server Component data
    } catch (error) {
      console.error(error);
      toast.error("Unable to save note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent =
    isOpen && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="font-serif text-xl font-normal text-[#29231D]">
                Add Transaction Note
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type your note here..."
                  rows={4}
                  className="w-full rounded-xl border border-[#E3DCD0] p-3 text-sm text-[#29231D] focus:border-[#B7832F] focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setNoteText("");
                    }}
                    className="rounded-xl border border-[#E3DCD0] px-4 py-2 text-sm font-medium text-[#7C7265] transition hover:bg-[#FBF7EF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !noteText.trim()}
                    className="rounded-xl bg-[#0D0C0A] px-4 py-2 text-sm font-semibold text-[#D8B66A] transition hover:bg-[#29231D] disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3DCD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#29231D] transition hover:bg-[#FBF7EF]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Note
      </button>

      {modalContent}
    </>
  );
}