"use client";

import { useRef, useState, useTransition, useMemo } from "react";
import {
  Upload,
  X,
  ChevronDown,
  FolderOpen,
  Search,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadTransactionDocument } from "@/app/actions/transactions/uploadTransactionDocument";
import { getTransactionDocumentUrl } from "@/app/actions/transactions/getTransactionDocumentUrl";
import { deleteTransactionDocument } from "@/app/actions/transactions/deleteTransactionDocument";
import ConfirmationDialog from "@/app/components/ui/ConfirmationDialog";
import { getFileIcon } from "@/lib/getFileIcon";

type TransactionDocument = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  category: string;
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<TransactionDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter documents based on search and category filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.file_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === "ALL" ||
        doc.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategoryFilter]);

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

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTransactionDocument(documentToDelete.id, transactionId);
      setMessage("Document deleted successfully.");
      setDialogOpen(false);
      setDocumentToDelete(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Unable to delete document.",
      );
    } finally {
      setIsDeleting(false);
    }
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

  const handleView = async (storagePath: string) => {
    try {
      const signedUrl = await getTransactionDocumentUrl(storagePath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setMessage("Unable to open document.");
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
        {/* Document Category Selector */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
            Upload Category:
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
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.zip"
            className="sr-only"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="flex w-full items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-[#EDE7DC]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-lg bg-[#FBF7EF] p-2 text-[#B7832F] shrink-0">
                  {getFileIcon(selectedFile.type)}
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0C0A] px-4 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition hover:bg-[#211E1A] disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Uploaded Documents List & Controls */}
      <div className="space-y-4 border-t border-[#EDE7DC] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
            Uploaded Documents ({filteredDocuments.length})
          </h3>

          {/* Search & Filter Toolbar */}
          {documents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8F8578]">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE7DC] bg-white py-1.5 pl-8 pr-3 text-xs text-[#29231D] placeholder-[#A89C8D] transition focus:border-[#B7832F] focus:outline-none focus:ring-1 focus:ring-[#B7832F]"
                />
              </div>

              {/* Category Filter */}
              <div className="relative w-full sm:w-40">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#EDE7DC] bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-[#29231D] transition focus:border-[#B7832F] focus:outline-none focus:ring-1 focus:ring-[#B7832F]"
                >
                  <option value="ALL">All Categories</option>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8F8578]">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EDE7DC] bg-[#FBF7EF]/30 p-8 text-center">
            <div className="rounded-full bg-[#EDE7DC]/60 p-3 text-[#B7832F] mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h4 className="font-serif text-lg text-[#29231D]">
              No Documents Yet
            </h4>
            <p className="mt-1 max-w-xs text-xs text-[#7C7265] leading-relaxed">
              Upload contracts, disclosures, photos, invoices, and other
              transaction files here.
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#EDE7DC] bg-[#FBF7EF]/20 p-6 text-center">
            <p className="text-xs text-[#7C7265]">
              No documents found matching &quot;{searchQuery}&quot;
              {selectedCategoryFilter !== "ALL"
                ? ` under ${selectedCategoryFilter}`
                : ""}
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#EDE7DC] bg-white p-4 shadow-sm transition hover:border-[#B7832F]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="rounded-lg bg-[#FBF7EF] p-2.5 text-[#B7832F] shrink-0">
                    {getFileIcon(document.mime_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[#29231D] truncate text-sm">
                        {document.file_name}
                      </p>
                      {document.category && (
                        <span className="inline-flex items-center rounded-md bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-medium text-[#B7832F] border border-[#EDE7DC]">
                          {document.category}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FBF7EF] border border-[#EDE7DC] px-2.5 py-0.5 text-[11px] font-medium text-[#B7832F]">
                        {document.category}
                      </span>

                      <span className="text-xs text-[#8F8578]">
                        {formatFileSize(document.file_size)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#8F8578]">
                      Uploaded{" "}
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDE7DC]">
                  <button
                    type="button"
                    onClick={() => handleView(document.storage_path)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#B7832F] transition hover:bg-[#FBF7EF]"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleView(document.storage_path)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#29231D] transition hover:bg-[#FBF7EF]"
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDocumentToDelete(document);
                      setDialogOpen(true);
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        title="Delete Document"
        description={
          <>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-[#29231D]">
              {documentToDelete?.file_name}
            </span>
            ?
            <br />
            <br />
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Document"
        loadingLabel="Deleting..."
        loading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDialogOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Purchase Agreement":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Inspection":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Offer":
      return "bg-green-50 text-green-700 border-green-200";

    case "Contract":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "Financing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Title":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "Insurance":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "Invoice":
      return "bg-rose-50 text-rose-700 border-rose-200";

    default:
      return "bg-[#FBF7EF] text-[#B7832F] border-[#EDE7DC]";
  }
}
