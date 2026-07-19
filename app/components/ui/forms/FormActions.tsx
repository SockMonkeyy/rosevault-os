import Link from "next/link";

interface FormActionsProps {
  isSaving?: boolean;
  saveLabel?: string;
  cancelHref?: string;
  cancelLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
  deleteDisabled?: boolean;
}

export default function FormActions({
  isSaving = false,
  saveLabel = "Save Changes",
  cancelHref,
  cancelLabel = "Cancel",
  onDelete,
  deleteLabel = "Delete",
  deleteDisabled = false,
}: FormActionsProps) {
  return (
    <div className="sticky bottom-0 z-20 mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E3DCD0] bg-[#FBF7EF]/95 px-6 py-4 backdrop-blur">
      <div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteLabel}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {cancelHref && (
          <Link
            href={cancelHref}
            className="rounded-md border border-[#D8D2C8] bg-white px-5 py-2.5 text-sm font-medium text-[#29231D] transition hover:bg-[#F5EEDF]"
          >
            {cancelLabel}
          </Link>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-[#0D0C0A] px-6 py-2.5 text-sm font-semibold text-[#D8B66A] transition duration-300 hover:bg-[#171512] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : saveLabel}
        </button>
      </div>
    </div>
  );
}