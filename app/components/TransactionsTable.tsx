"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  const [search, setSearch] = useState("");

  async function handleDeleteTransaction() {
    if (!transactionToDelete) return;

    const result = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionToDelete.id);

    console.log("Delete Result:", result);

    if (result.error) {
      console.error("Delete failed:", result.error);
      toast.error("Unable to delete transaction.");
      return;
    }

    toast.success("Transaction deleted successfully.");
    setTransactionToDelete(null);
    router.refresh();
  }

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((transaction) => {
      const address = [
        transaction.property?.property_address_line_1,
        transaction.property?.property_city,
        transaction.property?.property_state,
        transaction.property?.property_postal_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        transaction.transaction_name.toLowerCase().includes(query) ||
        transaction.transaction_type.toLowerCase().includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        address.includes(query)
      );
    });
  }, [transactions, search]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search transactions, status, type, or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#EDE7DC] bg-white/80 py-3 pl-11 pr-4 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
        />

        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Transaction Cards or Empty Search State */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-12 text-center backdrop-blur-sm">
          <h3 className="font-serif text-lg font-medium text-[#29231D]">
            No transactions found
          </h3>

          <p className="mt-1 text-sm text-[#7C7265]">
            Try adjusting your search query or add a new deal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => router.push(`/transactions/${transaction.id}`)}
              className="cursor-pointer rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D8B66A]/50 hover:bg-white hover:shadow-md hover:shadow-[#D8B66A]/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-normal text-[#29231D]">
                    {transaction.transaction_name}
                  </h2>

                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    {transaction.transaction_type
                      .replaceAll("_", " ")
                      .toUpperCase()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        transaction.status === "closed"
                          ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800"
                          : transaction.status === "under_contract"
                            ? "border border-amber-200/60 bg-amber-50 text-amber-800"
                            : transaction.status === "lead"
                              ? "border border-blue-200/60 bg-blue-50 text-blue-800"
                              : "border border-[#EDE7DC] bg-[#FBF7EF] text-[#7C7265]"
                      }`}
                    >
                      {transaction.status.replaceAll("_", " ")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/transactions/${transaction.id}/edit`);
                      }}
                      className="rounded-lg border border-[#EDE7DC] bg-white px-3 py-1 text-xs font-medium text-[#7C7265] transition-colors hover:border-[#D8B66A] hover:text-[#B7832F]"
                    >
                      Edit
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionToDelete(transaction);
                    }}
                    className="rounded-lg border border-rose-200/60 bg-rose-50/50 px-3 py-1 text-xs font-medium text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100/70"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Property Details */}
              <div className="mt-3 text-sm text-[#7C7265]">
                <p>
                  {transaction.property?.property_address_line_1 ??
                    "No Property Assigned"}
                </p>

                {transaction.property && (
                  <p>
                    {transaction.property.property_city},{" "}
                    {transaction.property.property_state}{" "}
                    {transaction.property.property_postal_code}
                  </p>
                )}
              </div>

              {/* Financial Summary */}
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#EDE7DC] pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Primary Amount
                  </p>

                  <p className="mt-1 font-serif text-lg font-normal text-[#B7832F]">
                    {transaction.transaction_type === "wholesale_assignment"
                      ? formatCurrency(transaction.assignment_fee)
                      : transaction.transaction_type === "sale"
                        ? formatCurrency(transaction.sale_price)
                        : formatCurrency(transaction.purchase_price)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Closing Date
                  </p>

                  <p className="mt-1 text-sm text-[#29231D]">
                    {formatDate(transaction.closing_date)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Status
                  </p>

                  <p className="mt-1 text-sm capitalize text-[#29231D]">
                    {transaction.status.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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