import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Receipt } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import TransactionForm from "@/app/components/TransactionForm";

type PropertyOption = {
  id: string;
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

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

  // 2. Get organization membership
  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    if (membershipError) {
      console.error(
        "Membership error:",
        membershipError,
      );
    }

    notFound();
  }

  // 3. Fetch the transaction
  const {
    data: transaction,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select("*")
    .eq(
      "organization_id",
      membership.organization_id,
    )
    .eq("id", id)
    .single();

  if (transactionError || !transaction) {
    console.error(
      "Fetch Error:",
      transactionError,
    );

    notFound();
  }

  // 4. Fetch properties belonging to this organization
  const {
    data: properties,
    error: propertiesError,
  } = await supabase
    .from("properties")
    .select(
      `
        id,
        property_address_line_1,
        property_city,
        property_state,
        property_postal_code
      `,
    )
    .eq(
      "organization_id",
      membership.organization_id,
    )
    .order(
      "property_address_line_1",
      { ascending: true },
    );

  if (propertiesError) {
    console.error(
      "Properties Fetch Error:",
      propertiesError,
    );
  }

  const propertyOptions: PropertyOption[] =
    properties ?? [];

  return (
    <div className="min-h-screen bg-[#FBF7EF] p-8 text-[#29231D]">
      <div className="mx-auto max-w-5xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href={`/transactions/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#B7832F] transition hover:text-[#966822] hover:underline"
          >
            ← Back to Transaction
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-[#EDE7DC] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D0C0A] text-[#D8B66A] shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#29231D]">
                Edit Transaction
              </h1>

              <p className="text-xs text-[#8F8578]">
                ID:{" "}
                <span className="font-mono text-[#0D0C0A]">
                  {id}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="rounded-2xl border border-[#EDE7DC] bg-[#FBF7EF]/40 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <TransactionForm
            mode="edit"
            transaction={transaction}
            properties={propertyOptions}
          />
        </div>
      </div>
    </div>
  );
}