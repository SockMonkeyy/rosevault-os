import Link from "next/link";
import { redirect } from "next/navigation";
import TransactionsTable from "@/app/components/TransactionsTable";
import { createClient } from "@/lib/supabase/server";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "Error loading organization membership:",
      membershipError,
    );
  }

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select(`
      id,
      organization_id,
      property_id,
      transaction_name,
      transaction_type,
      status,
      purchase_price,
      sale_price,
      assignment_fee,
      earnest_money,
      contract_date,
      inspection_deadline,
      financing_deadline,
      closing_date,
      actual_closing_date,
      title_company,
      closing_attorney,
      notes,
      created_at,
      updated_at
    `)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (transactionsError) {
    console.error("Error loading transactions:", transactionsError);
  }

  const propertyIds = [
    ...new Set(
      (transactions ?? [])
        .map((transaction) => transaction.property_id)
        .filter((propertyId): propertyId is string => Boolean(propertyId)),
    ),
  ];

  let properties: {
    id: string;
    property_address_line_1: string | null;
    property_city: string | null;
    property_state: string | null;
    property_postal_code: string | null;
  }[] = [];

  if (propertyIds.length > 0) {
    const { data: propertiesData, error: propertiesError } = await supabase
      .from("properties")
      .select(`
        id,
        property_address_line_1,
        property_city,
        property_state,
        property_postal_code
      `)
      .eq("organization_id", membership.organization_id)
      .in("id", propertyIds);

    if (propertiesError) {
      console.error(
        "Error loading transaction properties:",
        propertiesError,
      );
    } else {
      properties = propertiesData ?? [];
    }
  }

  const transactionRows = (transactions ?? []).map((transaction) => {
    const property =
      properties.find((item) => item.id === transaction.property_id) ?? null;

    return {
      ...transaction,
      property,
    };
  });

  const totalTransactions = transactionRows.length;

  const activeTransactions = transactionRows.filter((transaction) =>
    [
      "lead",
      "offer_made",
      "under_contract",
      "due_diligence",
      "clear_to_close",
    ].includes(transaction.status),
  ).length;

  const underContractTransactions = transactionRows.filter(
    (transaction) => transaction.status === "under_contract",
  ).length;

  const closedTransactions = transactionRows.filter(
    (transaction) => transaction.status === "closed",
  ).length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold text-white">
              Transactions
            </h1>

            <p className="mt-2 max-w-2xl text-gray-400">
              Manage purchases, sales, wholesale assignments, closings, key
              deadlines, and every active deal in RoseVault.
            </p>
          </div>

          <Link
            href="/transactions/new"
            className="rounded-lg bg-[#d4af37] px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            + New Transaction
          </Link>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Transactions"
            value={totalTransactions}
          />

          <SummaryCard
            label="Active Deals"
            value={activeTransactions}
          />

          <SummaryCard
            label="Under Contract"
            value={underContractTransactions}
          />

          <SummaryCard
            label="Closed"
            value={closedTransactions}
          />
        </div>

        {/* Transactions table */}
        {transactionRows.length === 0 ? (
          <section className="flex min-h-96 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#151515] p-8">
            <div className="max-w-lg text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10">
                <span className="font-serif text-xl text-[#d4af37]">RV</span>
              </div>

              <h2 className="mt-5 text-xl font-semibold text-white">
                No transactions yet
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Create your first transaction to begin tracking properties,
                financials, contract dates, closing deadlines, and deal
                progress inside RoseVault.
              </p>

              <Link
                href="/transactions/new"
                className="mt-6 inline-block rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
              >
                + Create First Transaction
              </Link>
            </div>
          </section>
        ) : (
          <TransactionsTable transactions={transactionRows} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-sm text-gray-400">{label}</p>

      <p className="mt-3 text-3xl font-semibold text-[#d4af37]">
        {value}
      </p>
    </div>
  );
}