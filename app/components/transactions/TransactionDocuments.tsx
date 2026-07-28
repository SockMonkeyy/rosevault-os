"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileText, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadTransactionDocument } from "@/app/actions/transactions/uploadTransactionDocument";

type TransactionDocument = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

const DOCUMENT_CATEGORIES = [
  "Purchase Agreement",
  "Inspection",
  "Offer",
  "Contract",
  "Appraisal",
  "Disclosures",
  "Title",
  "Insurance",
  "Financing",
  "Repair Estimate",
  "Invoice",
  "Other",
] as const;

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export function TransactionDocuments({
  transactionId,
  organizationId,
  documents = [],
}: {
  transactionId: string;
  organizationId: string;
  documents?: TransactionDocument[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("Purchase Agreement");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setMessage("Files must be smaller than 25 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMessage(null);
  };

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPending) return;

    const form = formRef.current;
    if (!form) return;

    if (!selectedFile) {
      setMessage("Please select a file.");
      return;
    }

    const formData = new FormData(form);
    formData.append("category", category);
    formData.append("organization_id", organizationId);

    setMessage(null);

    startTransition(async () => {
      try {
        const result = await uploadTransactionDocument(transactionId, formData);

        if (result?.success) {
          setMessage("File uploaded successfully!");
          setSelectedFile(null);
          form.reset();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

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

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMessage(null);
  };

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
        {/* Styled Custom-Looking Dropdown Menu */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
            Document Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isPending}
              className="w-full appearance-none rounded-xl border border-[#EDE7DC] bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-[#29231D] shadow-sm transition hover:border-[#B7832F] focus:border-[#B7832F] focus:outline-none focus:ring-1 focus:ring-[#B7832F] disabled:opacity-60"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="py-1 text-[#29231D]">
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8F8578]">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Upload Drop Zone */}
        <div
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#EDE7DC] bg-[#FBF7EF]/50 p-6 text-center transition hover:border-[#B7832F] ${
            isPending ? "pointer-events-none opacity-60" : ""
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (isPending) return;
            const file = e.dataTransfer.files?.[0];
            if (file) {
              if (file.size > MAX_SIZE) {
                setMessage("Files must be smaller than 25 MB.");
                return;
              }
              setSelectedFile(file);
              setMessage(null);
              if (fileInputRef.current) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInputRef.current.files = dt.files;
              }
            }
          }}
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
            className="sr-only"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="flex w-full items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-[#EDE7DC]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-lg bg-[#FBF7EF] p-2 text-[#B7832F] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium text-[#29231D] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[#8F8578]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                disabled={isPending}
                className="rounded-lg p-1.5 text-[#8F8578] transition hover:bg-gray-100 hover:text-red-600 shrink-0"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-full bg-[#EDE7DC]/60 p-3 text-[#B7832F]">
                <Upload className="h-5 w-5" />
              </div>

              <label htmlFor="file-upload" className="cursor-pointer space-y-1">
                <span className="text-sm font-medium text-[#29231D] hover:underline">
                  Click to upload or drag files here
                </span>

                <span className="block text-xs text-[#8F8578]">
                  PDF, DOC, DOCX, JPG, PNG, CSV (Max 25MB)
                </span>
              </label>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !selectedFile}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0C0A] px-4 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition hover:bg-[#29231D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading Document..." : "Confirm & Upload Document"}
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

      {documents.length > 0 && (
        <div className="space-y-3 border-t border-[#EDE7DC] pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
            Uploaded Documents
          </h3>

          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#EDE7DC] bg-white p-4 shadow-sm transition hover:border-[#B7832F]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="rounded-lg bg-[#FBF7EF] p-3 text-[#B7832F] shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#29231D] truncate text-sm">
                      {document.file_name}
                    </p>

                    <p className="text-xs text-[#8F8578]">
                      {formatFileSize(document.file_size)}
                    </p>

                    <p className="text-xs text-[#8F8578]">
                      Uploaded{" "}
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#B7832F] hover:bg-[#FBF7EF]">
                    View
                  </button>

                  <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#29231D] hover:bg-[#FBF7EF]">
                    Download
                  </button>

                  <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
