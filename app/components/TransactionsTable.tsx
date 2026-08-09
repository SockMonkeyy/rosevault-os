"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { exportRowsToCsv } from "@/lib/table/export";
import { DataTable } from "@/app/components/ui/data-table";
import { DataTableColumn } from "@/lib/table/types";

export type Property = {
  id: string;
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

export type TransactionRow = {
  id: string;
  transaction_name: string;
  transaction_type: string;
  status: string;
  purchase_price: number | null;
  sale_price: number | null;
  assignment_fee: number | null;
  closing_date: string | null;
  property: Property | null;
};

interface TransactionsTableProps {
  transactions: TransactionRow[];
}

export default function TransactionsTable({
  transactions,
}: TransactionsTableProps) {
  const router = useRouter();
  const supabase = createClient();

  const [transactionToDelete, setTransactionToDelete] =
    useState<TransactionRow | null>(null);

  async function handleDeleteTransaction() {
    if (!transactionToDelete) return;

    const result = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionToDelete.id);

    if (result.error) {
      console.error("Delete failed:", result.error);
      toast.error("Unable to delete transaction.");
      return;
    }

    toast.success("Transaction deleted successfully.");
    setTransactionToDelete(null);
    router.refresh();
  }

  // Define columns for the shared DataTable component
  const columns: DataTableColumn<TransactionRow>[] = [
    {
      id: "transaction",
      header: "Transaction",
      sortable: true,
      sortValue: (row) => row.transaction_name ?? "",
      cell: (row) => (
        <div>
          <div className="font-serif text-base font-normal text-[#29231D]">
            {row.transaction_name}
          </div>
          <div className="text-xs text-[#8F8578]">
            {row.property?.property_address_line_1 ?? "No Property"}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      sortable: true,
      sortValue: (row) => row.transaction_type ?? "",
      cell: (row) => (
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          {row.transaction_type.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status ?? "",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            row.status === "closed"
              ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800"
              : row.status === "under_contract"
                ? "border border-amber-200/60 bg-amber-50 text-amber-800"
                : row.status === "lead"
                  ? "border border-blue-200/60 bg-blue-50 text-blue-800"
                  : "border border-[#EDE7DC] bg-[#FBF7EF] text-[#7C7265]"
          }`}
        >
          {row.status.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      id: "closing",
      header: "Closing",
      sortable: true,
      sortValue: (row) => row.closing_date ?? "",
      cell: (row) => (
        <span className="text-sm text-[#29231D]">
          {row.closing_date ? formatDate(row.closing_date) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        selectable
        data={transactions}
        columns={columns}
        rowKey={(row) => row.id}
        emptyTitle="No Transactions"
        emptyDescription="Create your first transaction to begin tracking deals."
        bulkActions={[
          {
            label: "Export",
            onClick: (rows) => exportRowsToCsv(rows, "transactions"),
          },
        ]}
        onRowClick={(row) => {
          router.push(`/transactions/${row.id}`);
        }}
      />

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29231D]/40 backdrop-blur-sm"
          onClick={() => setTransactionToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#EDE7DC] bg-[#FDFBF7] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl font-medium text-[#29231D]">
              Delete Transaction?
            </h2>

            <p className="mt-3 text-sm text-[#7C7265]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#29231D]">
                {transactionToDelete.transaction_name}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-rose-700">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTransactionToDelete(null);
                }}
                className="rounded-lg border border-[#EDE7DC] bg-white px-4 py-2 text-sm font-medium text-[#7C7265] transition-colors hover:bg-[#FBF7EF] hover:text-[#29231D]"
              >
                Cancel
              </button>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDeleteTransaction();
                }}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
