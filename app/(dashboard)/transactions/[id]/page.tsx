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
  DollarSign,
  Edit,
  FileText,
  CheckSquare,
  MessageSquare,
  Clock,
} from "lucide-react";
import TransactionChecklist from "@/app/components/transactions/TransactionChecklist";
import { getTransactionChecklist } from "@/lib/transactions/getTransactionChecklist";
import { seedTransactionChecklist } from "@/lib/transactions/seedTransactionChecklist";

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
    .select(
      `
      id,
      file_name,
      storage_path,
      mime_type,
      file_size,
      uploaded_by,
      created_at,
      category
    `,
    )
    .eq("transaction_id", transaction.id)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error loading documents:", documentsError);
  }

  // Seed and load the dynamic transaction checklist
  await seedTransactionChecklist(
    membership.organization_id,
    transaction.id,
    transaction.status,
  );

  const checklist = await getTransactionChecklist(
    membership.organization_id,
    transaction.id,
  );

  const docCount = documents?.length ?? 0;
  const noteCount = notes?.length ?? 0;
  const activityCount = activity?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Header Section */}
      <div className="space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8F8578] transition-colors hover:text-[#29231D]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl font-normal text-[#29231D] sm:text-4xl">
                {transaction.transaction_name}
              </h1>
              <StatusBadge status={transaction.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#7C7265]">
              <span className="font-medium text-[#29231D]">
                {transaction.transaction_type
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </span>
              {transaction.property && (
                <>
                  <span className="text-[#8F8578]">•</span>
                  <span>{transaction.property.property_address_line_1}</span>
                </>
              )}
            </div>
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

      {/* 2. Quick Stats Overview Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#EDE7DC] bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="rounded-xl bg-[#F7F4EF] p-2.5 text-[#B7832F]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
              Documents
            </p>
            <p className="text-lg font-serif text-[#29231D]">{docCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#EDE7DC] bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="rounded-xl bg-[#F7F4EF] p-2.5 text-[#B7832F]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
              Notes
            </p>
            <p className="text-lg font-serif text-[#29231D]">{noteCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#EDE7DC] bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="rounded-xl bg-[#F7F4EF] p-2.5 text-[#B7832F]">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
              Tasks
            </p>
            <p className="text-lg font-serif text-[#29231D]">0</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#EDE7DC] bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="rounded-xl bg-[#F7F4EF] p-2.5 text-[#B7832F]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
              Activity
            </p>
            <p className="text-lg font-serif text-[#29231D]">{activityCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Asymmetric Layout (70% Left Core Workspace vs 30% Right Sidebar) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (70% / 8 spans): Property, Financials, Documents, & Notes */}
        <div className="space-y-8 lg:col-span-8">
          {/* Property Details */}
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
                    <p className="mt-1 font-medium text-[#29231D]">
                      {transaction.property.property_address_line_1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8578]">
                      Location
                    </p>
                    <p className="mt-1 font-medium text-[#29231D]">
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
                    View Property Record →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#7C7265]">No property linked.</p>
            )}
          </div>

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

          {/* Documents & Files */}
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

          {/* Notes Section */}
          <SectionCard
            title="Notes"
            actions={
              <AddTransactionNoteButton transactionId={transaction.id} />
            }
          >
            <TransactionNotes notes={notes} />
          </SectionCard>
        </div>

        {/* Right Column (30% / 4 spans): Transaction Checklist, Details, & Activity */}
        <div className="space-y-8 lg:col-span-4">
          {/* Dynamic Transaction Checklist Component */}
          <TransactionChecklist items={checklist} />

          {/* Transaction Details Metadata Card */}
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <h2 className="font-serif text-lg font-normal text-[#29231D]">
              Transaction Details
            </h2>
            <div className="space-y-1">
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

          {/* Activity Stream */}
          <SectionCard title="Activity" description="Recent log entries.">
            <TransactionActivity activity={activity} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F1ECE3] py-3 text-sm last:border-b-0">
      <span className="text-[#7C7265]">{label}</span>
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}