"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}

export default function TransactionEditForm({ transaction }: Props) {
  const [transactionType, setTransactionType] = useState(
    transaction.transaction_type ?? "purchase",
  );
  const router = useRouter();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);

  const [transactionName, setTransactionName] = useState(
    transaction.transaction_name ?? "",
  );

  const [status, setStatus] = useState(transaction.status ?? "lead");

  const [purchasePrice, setPurchasePrice] = useState(
    transaction.purchase_price?.toString() ?? "",
  );

  const [salePrice, setSalePrice] = useState(
    transaction.sale_price?.toString() ?? "",
  );

  const [assignmentFee, setAssignmentFee] = useState(
    transaction.assignment_fee?.toString() ?? "",
  );

  const [closingDate, setClosingDate] = useState(
    transaction.closing_date ?? "",
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

    toast.success("Transaction updated.");

    router.push(`/transactions/${transaction.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 backdrop-blur-sm sm:p-8"
    >
      {/* Transaction Name */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Transaction Name
        </label>

        <input
          type="text"
          value={transactionName}
          onChange={(e) => setTransactionName(e.target.value)}
          placeholder="e.g., Main Street Purchase"
          className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Transaction Type
        </label>

        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="w-full rounded-xl border border-[#EDE7DC] px-4 py-3"
        >
          <option value="purchase">Purchase</option>
          <option value="sale">Sale</option>
          <option value="wholesale_assignment">Wholesale Assignment</option>
          <option value="rehab">Rehab</option>
          <option value="rental">Rental</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Status
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
        >
          <option value="lead">Lead</option>
          <option value="under_contract">Under Contract</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Financials Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
            Purchase Price
          </label>

          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
            Sale Price
          </label>

          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
            Assignment Fee
          </label>

          <input
            type="number"
            value={assignmentFee}
            onChange={(e) => setAssignmentFee(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
          />
        </div>
      </div>

      {/* Closing Date */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Closing Date
        </label>

        <input
          type="date"
          value={closingDate}
          onChange={(e) => setClosingDate(e.target.value)}
          className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
        />
      </div>

      {/* Form Action Controls */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-[#EDE7DC] px-6 py-3 text-[#7C7265] hover:bg-[#FBF7EF]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-black px-6 py-3 text-[#D8B66A]"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
