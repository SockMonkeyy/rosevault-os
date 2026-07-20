import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionEditForm from "@/app/components/TransactionEditForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !transaction) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Transactions
        </p>

        <h1 className="mt-2 font-serif text-4xl text-[#29231D]">
          Edit Transaction
        </h1>
      </div>

      <div className="rounded-2xl border border-[#EDE7DC] bg-white/70 p-8">
        <TransactionEditForm transaction={transaction} />
      </div>
    </div>
  );
}