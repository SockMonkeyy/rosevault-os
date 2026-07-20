"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TransactionProperty = {
  id: string;
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

type Transaction = {
  id: string;
  organization_id: string;
  property_id: string | null;
  transaction_name: string;
  transaction_type: string;
  status: string;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  assignment_fee: number | string | null;
  earnest_money: number | string | null;
  contract_date: string | null;
  inspection_deadline: string | null;
  financing_deadline: string | null;
  closing_date: string | null;
  actual_closing_date: string | null;
  title_company: string | null;
  closing_attorney: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  property: TransactionProperty | null;
};

type Props = {
  transactions: Transaction[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "lead", label: "Lead / Opportunity" },
  { value: "offer_made", label: "Offer Made" },
  { value: "under_contract", label: "Under Contract" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "clear_to_close", label: "Clear to Close" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "terminated", label: "Terminated" },
  { value: "lost", label: "Lost" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Transaction Types" },
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
  { value: "wholesale_assignment", label: "Wholesale Assignment" },
  { value: "double_close", label: "Double Close" },
  { value: "subject_to", label: "Subject-To" },
  { value: "seller_finance", label: "Seller Finance" },
  { value: "lease", label: "Lease" },
  { value: "other", label: "Other" },
];

export default function TransactionsTable({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const propertySearchText = transaction.property
        ? [
            transaction.property.property_address_line_1,
            transaction.property.property_city,
            transaction.property.property_state,
            transaction.property.property_postal_code,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        : "";

      const matchesSearch =
        !query ||
        transaction.transaction_name.toLowerCase().includes(query) ||
        propertySearchText.includes(query) ||
        transaction.title_company?.toLowerCase().includes(query) ||
        transaction.closing_attorney?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        transaction.transaction_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search transactions, properties, title companies..."
            className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Showing {filteredTransactions.length} of {transactions.length}{" "}
          transactions
        </p>
      </section>

      {/* Transaction cards */}
      {filteredTransactions.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#333333] bg-[#151515] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-white">
            No transactions match your filters
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
            Try changing your search, status, or transaction-type filters.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionCard({
  transaction,
}: {
  transaction: Transaction;
}) {
  const propertyAddress = transaction.property
    ? [
        transaction.property.property_address_line_1,
        [
          transaction.property.property_city,
          transaction.property.property_state,
        ]
          .filter(Boolean)
          .join(", "),
        transaction.property.property_postal_code,
      ]
        .filter(Boolean)
        .join(" ")
    : "No property linked";

  const primaryFinancialValue = getPrimaryFinancialValue(transaction);

  

  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="group block rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5 transition hover:border-[#d4af37]/40 hover:bg-[#171717]"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={transaction.status} />

            <span className="rounded-full border border-[#333333] px-2.5 py-1 text-xs text-gray-500">
              {formatLabel(transaction.transaction_type)}
            </span>
          </div>

          <h2 className="mt-3 truncate text-lg font-semibold text-white transition group-hover:text-[#d4af37]">
            {transaction.transaction_name}
          </h2>

          <p className="mt-1 truncate text-sm text-gray-500">
            {propertyAddress}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 xl:flex xl:items-center xl:gap-10">
          <CardDetail
            label={primaryFinancialValue.label}
            value={primaryFinancialValue.value}
          />

          <CardDetail
            label="Closing Date"
            value={formatDate(transaction.closing_date)}
          />

          <div className="hidden xl:block">
            <span className="text-sm font-medium text-[#d4af37]">
              View Transaction →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-gray-700 bg-gray-900/50 text-gray-300",
    lead: "border-blue-900/50 bg-blue-950/30 text-blue-300",
    offer_made: "border-purple-900/50 bg-purple-950/30 text-purple-300",
    under_contract:
      "border-amber-900/50 bg-amber-950/30 text-amber-300",
    due_diligence:
      "border-orange-900/50 bg-orange-950/30 text-orange-300",
    clear_to_close:
      "border-emerald-900/50 bg-emerald-950/30 text-emerald-300",
    closed: "border-green-900/50 bg-green-950/30 text-green-300",
    cancelled: "border-gray-700 bg-gray-900/50 text-gray-500",
    terminated: "border-red-900/50 bg-red-950/30 text-red-300",
    lost: "border-red-900/50 bg-red-950/30 text-red-400",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? styles.draft
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function getPrimaryFinancialValue(transaction: Transaction) {
  if (
    transaction.transaction_type === "wholesale_assignment" &&
    transaction.assignment_fee !== null
  ) {
    return {
      label: "Assignment Fee",
      value: formatCurrency(transaction.assignment_fee),
    };
  }

  if (
    transaction.transaction_type === "sale" &&
    transaction.sale_price !== null
  ) {
    return {
      label: "Sale Price",
      value: formatCurrency(transaction.sale_price),
    };
  }



  return {
    label: "Purchase Price",
    value: formatCurrency(transaction.purchase_price),
  };
}

function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}