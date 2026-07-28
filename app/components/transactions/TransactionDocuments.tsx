"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadTransactionDocument } from "@/app/actions/transactions/uploadTransactionDocument";

export function TransactionDocuments({
  transactionId,
}: {
  transactionId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = formRef.current;
    if (!form) return;

    const fileInput = form.elements.namedItem(
      "file",
    ) as HTMLInputElement | null;

    if (!fileInput?.files?.length) {
      setMessage("Please select a file.");
      return;
    }

    const formData = new FormData(form);

    setMessage(null);

    startTransition(async () => {
      try {
        const result = await uploadTransactionDocument(transactionId, formData);

        if (result?.success) {
          setMessage("File uploaded successfully!");
          form.reset();
          setSelectedFile(null);

          // Refresh the page so the document list updates
          router.refresh();
        }
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Error uploading file. Please try again.",
        );
      }
    });
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#EDE7DC] bg-[#FBF7EF]/50 p-6 text-center transition hover:border-[#B7832F]">
          <div className="mb-3 rounded-full bg-[#EDE7DC]/60 p-3 text-[#B7832F]">
            <Upload className="h-5 w-5" />
          </div>

          <label htmlFor="file-upload" className="cursor-pointer space-y-1">
            <span className="text-sm font-medium text-[#29231D] hover:underline">
              Click to upload a document
            </span>

            <span className="block text-xs text-[#8F8578]">
              PDF, DOC, DOCX, JPG, PNG
            </span>
          </label>

          <input
            id="file-upload"
            name="file"
            type="file"
            required
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
              setMessage(null);
            }}
          />
        </div>

        {selectedFile && (
          <div className="mt-4 rounded-lg border border-[#EDE7DC] bg-white px-4 py-3">
            <p className="text-sm font-medium text-[#29231D]">Selected file</p>
            <p className="mt-1 text-sm text-[#8F8578]">{selectedFile.name}</p>
            <p className="text-xs text-[#B7832F]">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0C0A] px-4 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition hover:bg-[#29231D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {message && (
        <p
          className={`text-center text-xs font-medium ${
            message.includes("success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
