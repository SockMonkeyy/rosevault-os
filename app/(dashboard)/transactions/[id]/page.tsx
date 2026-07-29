import { notFound } from "next/navigation";
import Link from "next/link";
import TransactionActivity from "@/app/components/transactions/TransactionActivity";
import { createClient } from "@/lib/supabase/server";
import { getActivity } from "@/lib/activity/getActivity";
import { getTransactionNotes } from "@/lib/transactions/getTransactionNotes";
import AddTransactionNoteButton from "@/app/components/transactions/AddTransactionNoteButton";
import TransactionNotes from "@/app/components/transactions/TransactionNotes";
import StatusBadge from "@/app/components/ui/StatusBadge";
import SectionCard from "@/app/components/ui/SectionCard";
import { TransactionDocuments } from "@/app/components/transactions/TransactionDocuments";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch active membership/organization details for tenant safety
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (membershipError || !membership) {
    if (membershipError) console.error("Membership error:", membershipError);
    notFound();
  }

  // 2. Fetch the transaction scoped to the organization along with its related property data
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*, property:properties(*)")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .single();

  if (error || !transaction) {
    notFound();
  }

  const notes = await getTransactionNotes(
    membership.organization_id,
    transaction.id,
  );

  const activity = await getActivity(
    membership.organization_id,
    "transaction",
    transaction.id,
  );

  const { data: documents, error: documentsError } = await supabase
    .from("transaction_documents")
    .select(`
      id,
      file_name,
      storage_path,
      mime_type,
      file_size,
      uploaded_by,
      created_at,
      category
    `)
    .eq("transaction_id", transaction.id)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error loading documents:", documentsError);
  }

  const timelineSteps = [
    {
      label: "Created",
      statuses: [
        "lead",
        "offer_made",
        "under_contract",
        "due_diligence",
        "clear_to_close",
        "closed",
      ],
    },
    {
      label: "Offer Made",
      statuses: [
        "offer_made",
        "under_contract",
        "due_diligence",
        "clear_to_close",
        "closed",
      ],
    },
    {
      label: "Under Contract",
      statuses: ["under_contract", "due_diligence", "clear_to_close", "closed"],
    },
    {
      label: "Due Diligence",
      statuses: ["due_diligence", "clear_to_close", "closed"],
    },
    {
      label: "Clear To Close",
      statuses: ["clear_to_close", "closed"],
    },
    {
      label: "Closed",
      statuses: ["closed"],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8F8578] transition-colors hover:text-[#29231D]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-normal text-[#29231D]">
                {transaction.transaction_name}
              </h1>
              <StatusBadge status={transaction.status} />
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
              {transaction.transaction_type.replaceAll("_", " ").toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/transactions/${transaction.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D0C0A] px-5 py-2.5 text-sm font-semibold text-[#D8B66A] shadow-md transition hover:bg-[#29231D]"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>

            <AddTransactionNoteButton transactionId={transaction.id} />
          </div>
        </div>
      </div>

      <hr className="border-[#EDE7DC]" />

      {/* Two-Column Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Financial Summary */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#B7832F]" />
              <h2 className="font-serif text-xl font-normal text-[#29231D]">
                Financial Summary
              </h2>
            </div>
            <div>
              <SummaryRow
                label="Purchase Price"
                value={formatCurrency(transaction.purchase_price)}
              />
              <SummaryRow
                label="Sale Price"
                value={formatCurrency(transaction.sale_price)}
              />
              <SummaryRow
                label="Assignment Fee"
                value={formatCurrency(transaction.assignment_fee)}
              />
              <SummaryRow
                label="Earnest Money"
                value={formatCurrency(transaction.earnest_money)}
              />
            </div>
          </div>

          {/* Property Information Section */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#B7832F]" />
              <h2 className="font-serif text-xl font-normal text-[#29231D]">
                Property Details
              </h2>
            </div>

            {transaction.property ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-[#7C7265]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
                      Address
                    </p>
                    <p className="mt-1 text-[#29231D] font-medium">
                      {transaction.property.property_address_line_1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
                      Location
                    </p>
                    <p className="mt-1 text-[#29231D] font-medium">
                      {transaction.property.property_city},{" "}
                      {transaction.property.property_state}{" "}
                      {transaction.property.property_postal_code}
                    </p>
                  </div>
                </div>
                <div>
                  <Link
                    href={`/properties/${transaction.property.id}`}
                    className="inline-flex items-center text-sm font-medium text-[#B7832F] hover:underline"
                  >
                    View Property →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#7C7265]">No property linked.</p>
            )}
          </div>

          {/* Notes Section */}
          <SectionCard
            title="Notes"
            actions={
              <AddTransactionNoteButton transactionId={transaction.id} />
            }
          >
            <TransactionNotes notes={notes} />
          </SectionCard>

          {/* Activity Section */}
          <SectionCard
            title="Activity"
            description="Everything that has happened on this transaction."
          >
            <TransactionActivity activity={activity} />
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Deal Timeline */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#B7832F]" />
              <h2 className="font-serif text-xl font-normal text-[#29231D]">
                Deal Timeline
              </h2>
            </div>
            <div className="space-y-3 pt-2">
              {timelineSteps.map((step) => {
                const isCompleted = step.statuses.includes(transaction.status);
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-[#B7832F]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#D1C7B7]" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isCompleted ? "text-[#29231D]" : "text-[#8F8578]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deal Metadata */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#B7832F]" />
              <h2 className="font-serif text-xl font-normal text-[#29231D]">
                Deal Information
              </h2>
            </div>
            <div>
              <SummaryRow
                label="Transaction Type"
                value={transaction.transaction_type
                  .replaceAll("_", " ")
                  .toUpperCase()}
              />
              <SummaryRow
                label="Created"
                value={formatDate(transaction.created_at?.split("T")[0])}
              />
              <SummaryRow
                label="Updated"
                value={formatDate(transaction.updated_at?.split("T")[0])}
              />
              <SummaryRow
                label="Closing Attorney"
                value={transaction.closing_attorney ?? "—"}
              />
              <SummaryRow
                label="Title Company"
                value={transaction.title_company ?? "—"}
              />
            </div>
          </div>

          {/* Documents Section styled consistently */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#B7832F]" />
              <h2 className="font-serif text-xl font-normal text-[#29231D]">
                Documents & Files
              </h2>
            </div>
            <div className="pt-2">
              <TransactionDocuments
                transactionId={transaction.id}
                organizationId={membership.organization_id}
                documents={documents || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F1ECE3] py-3 last:border-b-0">
      <span className="text-sm text-[#7C7265]">{label}</span>
      <span className="font-medium text-[#29231D]">{value}</span>
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}