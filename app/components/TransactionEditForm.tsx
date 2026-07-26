"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Calendar, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Transaction {
  id: string;
  transaction_name?: string | null;
  transaction_type?: string | null;
  status?: string | null;
  purchase_price?: number | null;
  sale_price?: number | null;
  assignment_fee?: number | null;
  closing_date?: string | null;
}

interface Props {
  transaction: Transaction;
}

export default function TransactionEditForm({ transaction }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);
  const [transactionName, setTransactionName] = useState(
    transaction.transaction_name ?? ""
  );
  const [transactionType, setTransactionType] = useState(
    transaction.transaction_type ?? "purchase"
  );
  const [status, setStatus] = useState(transaction.status ?? "lead");
  const [purchasePrice, setPurchasePrice] = useState(
    transaction.purchase_price?.toString() ?? ""
  );
  const [salePrice, setSalePrice] = useState(
    transaction.sale_price?.toString() ?? ""
  );
  const [assignmentFee, setAssignmentFee] = useState(
    transaction.assignment_fee?.toString() ?? ""
  );
  const [closingDate, setClosingDate] = useState(
    transaction.closing_date ?? ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from("transactions")
      .update({
        transaction_type: transactionType,
        transaction_name: transactionName,
        status,
        purchase_price: purchasePrice === "" ? null : Number(purchasePrice),
        sale_price: salePrice === "" ? null : Number(salePrice),
        assignment_fee: assignmentFee === "" ? null : Number(assignmentFee),
        closing_date: closingDate || null,
      })
      .eq("id", transaction.id);

    setIsSaving(false);

    if (error) {
      toast.error("Unable to update transaction.");
      return;
    }

    toast.success("Transaction updated successfully.");
    router.push(`/transactions/${transaction.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Details Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          General Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Transaction Name
            </label>
            <input
              type="text"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
              placeholder="e.g., Main Street Purchase"
              required
              className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-2.5 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
                Transaction Type
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-2.5 text-sm text-[#29231D] shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              >
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="wholesale_assignment">Wholesale Assignment</option>
                <option value="rehab">Rehab</option>
                <option value="rental">Rental</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-2.5 text-sm text-[#29231D] shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              >
                <option value="lead">Lead</option>
                <option value="under_contract">Under Contract</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-[#EDE7DC]" />

      {/* Financials Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Financials
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Purchase Price
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white pl-9 pr-4 py-2.5 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Sale Price
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white pl-9 pr-4 py-2.5 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Assignment Fee
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />
              <input
                type="number"
                value={assignmentFee}
                onChange={(e) => setAssignmentFee(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white pl-9 pr-4 py-2.5 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-[#EDE7DC]" />

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Timeline
        </h3>

        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
            Closing Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full rounded-xl border border-[#EDE7DC] bg-white pl-9 pr-4 py-2.5 text-sm text-[#29231D] shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSaving}
          className="rounded-xl border border-[#EDE7DC] bg-white px-5 py-2.5 text-sm font-medium text-[#29231D] shadow-sm hover:bg-[#FBF7EF] transition-colors focus:outline-none"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D0C0A] px-6 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition-all hover:bg-[#29231D] disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}