import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TransactionForm from "@/app/components/TransactionForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch active membership/organization details for the user
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    if (membershipError) console.error("Membership error:", membershipError);
    notFound();
  }

  // 3. Fetch transaction scoped to the organization
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .eq("id", id)
    .single();

  if (transactionError || !transaction) {
  console.error("Fetch Error:", transactionError);
  return <div>Failed to load transaction ID: {id}</div>; // Remove notFound() temporarily
}

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8F8578] transition-colors hover:text-[#29231D]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Transactions
        </Link>

        <div className="flex items-center justify-between border-b border-[#EDE7DC] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D0C0A] text-[#D8B66A] shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#29231D]">
                Edit Transaction
              </h1>
              <p className="text-xs text-[#8F8578]">
                ID: <span className="font-mono text-[#0D0C0A]">{id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-[#EDE7DC] bg-[#FBF7EF]/40 p-6 shadow-sm backdrop-blur-md sm:p-8">
        <TransactionForm mode="edit" transaction={transaction} />
      </div>
    </div>
  );
}