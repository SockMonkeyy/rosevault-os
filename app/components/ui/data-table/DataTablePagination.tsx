interface Props {
  page: number;

  totalPages: number;

  onPrevious: () => void;

  onNext: () => void;
}

export default function DataTablePagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between border-t border-[#EDE7DC] px-6 py-4">
      <button
        onClick={onPrevious}
        disabled={page === 1}
        className="rounded-lg border border-[#EDE7DC] px-4 py-2 text-sm disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm text-[#7C7265]">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="rounded-lg border border-[#EDE7DC] px-4 py-2 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}