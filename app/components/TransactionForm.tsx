"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Calendar, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { updateTransaction } from "@/app/actions/transactions/updateTransaction";

interface Transaction {
  id: string;
  transaction_name?: string | null;
  transaction_type?: string | null;
  status?: string | null;

  property_id?: string | null;

  purchase_price?: number | null;
  sale_price?: number | null;
  assignment_fee?: number | null;
  closing_date?: string | null;
}

interface PropertyOption {
  id: string;
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
}

interface Props {
  mode: "create" | "edit";
  transaction?: Transaction;
  properties?: PropertyOption[];
}

function formatPropertyAddress(property: PropertyOption) {
  const address = [
    property.property_address_line_1,
    property.property_city,
    property.property_state,
    property.property_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  return address || "Unnamed Property";
}

export default function TransactionForm({
  mode,
  transaction,
  properties = [],
}: Props) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  const [transactionName, setTransactionName] = useState(
    transaction?.transaction_name ?? "",
  );

  const [transactionType, setTransactionType] = useState(
    transaction?.transaction_type ?? "purchase",
  );

  const [status, setStatus] = useState(transaction?.status ?? "lead");

  const [propertyId, setPropertyId] = useState(transaction?.property_id ?? "");

  const [purchasePrice, setPurchasePrice] = useState(
    transaction?.purchase_price?.toString() ?? "",
  );

  const [salePrice, setSalePrice] = useState(
    transaction?.sale_price?.toString() ?? "",
  );

  const [assignmentFee, setAssignmentFee] = useState(
    transaction?.assignment_fee?.toString() ?? "",
  );

  const [closingDate, setClosingDate] = useState(
    transaction?.closing_date ?? "",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    if (mode === "create") {
      try {
        // If you have a createTransaction action, call it here and capture the result:
        // const newTransaction = await createTransaction({ ... });

        toast.success("Transaction created successfully.");

        // If your create action returns the created transaction with an id,
        // you can redirect to it like this:
        // const targetId = newTransaction?.id;
        // if (targetId) {
        //   router.push(`/transactions/${targetId}`);
        // } else {
        //   router.push("/transactions");
        // }

        router.push("/transactions");
        router.refresh();
      } catch (error) {
        console.error(error);

        toast.error("Unable to create transaction.");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (!transaction) {
      toast.error("Transaction not found.");
      setIsSaving(false);
      return;
    }

    try {
      await updateTransaction({
        transactionId: transaction.id,

        transaction_name: transactionName,

        transaction_type: transactionType,

        status,

        property_id: propertyId || null,

        purchase_price: purchasePrice === "" ? null : Number(purchasePrice),

        sale_price: salePrice === "" ? null : Number(salePrice),

        assignment_fee: assignmentFee === "" ? null : Number(assignmentFee),

        closing_date: closingDate || null,
      });

      toast.success("Transaction updated successfully.");

      router.push(`/transactions/${transaction.id}`);
    } catch (error) {
      console.error("Transaction save failed:", error);

      toast.error("Unable to update transaction.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          General Details
        </h3>

        <div className="space-y-4">
          {/* Transaction Name */}
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

          {/* Type / Status */}
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

                <option value="wholesale_assignment">
                  Wholesale Assignment
                </option>

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

                <option value="offer_made">Offer Made</option>

                <option value="under_contract">Under Contract</option>

                <option value="due_diligence">Due Diligence</option>

                <option value="clear_to_close">Clear to Close</option>

                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Property */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Property
            </label>

            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#EDE7DC] bg-white py-2.5 pl-9 pr-4 text-sm text-[#29231D] shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              >
                <option value="">No property linked</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {formatPropertyAddress(property)}
                  </option>
                ))}
              </select>
            </div>

            {propertyId && (
              <p className="mt-2 text-xs text-[#8F8578]">
                This transaction is linked to the selected property.
              </p>
            )}

            {!propertyId && properties.length > 0 && (
              <p className="mt-2 text-xs text-[#8F8578]">
                Select a property to connect this transaction to an existing
                property record.
              </p>
            )}

            {properties.length === 0 && (
              <p className="mt-2 text-xs text-[#8F8578]">
                No properties are available in your organization yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-[#EDE7DC]" />

      {/* Financials */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Financials
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Purchase Price */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Purchase Price
            </label>

            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white py-2.5 pl-9 pr-4 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>
          </div>

          {/* Sale Price */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Sale Price
            </label>

            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white py-2.5 pl-9 pr-4 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>
          </div>

          {/* Assignment Fee */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
              Assignment Fee
            </label>

            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

              <input
                type="number"
                value={assignmentFee}
                onChange={(e) => setAssignmentFee(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white py-2.5 pl-9 pr-4 text-sm text-[#29231D] placeholder-[#8F8578]/60 shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>

            {transactionType === "wholesale_assignment" && (
              <p className="mt-1.5 text-xs text-[#8F8578]">
                This amount is counted as the Pipeline Value for wholesale
                assignments.
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-[#EDE7DC]" />

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Timeline
        </h3>

        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-[#29231D]">
            Closing Date
          </label>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]" />

            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full rounded-xl border border-[#EDE7DC] bg-white py-2.5 pl-9 pr-4 text-sm text-[#29231D] shadow-sm transition-all focus:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/20"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSaving}
          className="rounded-xl border border-[#EDE7DC] bg-white px-5 py-2.5 text-sm font-medium text-[#29231D] shadow-sm transition-colors hover:bg-[#FBF7EF] focus:outline-none disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D0C0A] px-6 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition-all hover:bg-[#29231D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === "create" ? "Create Transaction" : "Save Changes"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}