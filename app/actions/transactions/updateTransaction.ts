"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface UpdateTransactionParams {
  transactionId: string;

  transaction_name: string;
  transaction_type: string;
  status: string;

  property_id: string | null;

  purchase_price: number | null;
  sale_price: number | null;
  assignment_fee: number | null;

  closing_date: string | null;
}

export async function updateTransaction(params: UpdateTransactionParams) {
  console.log("updateTransaction() called");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get the user's organization
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Unauthorized organization access.");
  }

  // Fetch the existing transaction
  const { data: existingTransaction, error: existingError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", params.transactionId)
    .eq("organization_id", membership.organization_id)
    .single();

  if (existingError || !existingTransaction) {
    throw new Error("Transaction not found.");
  }

  // Track important transaction changes
  const trackedFields = [
    {
      key: "transaction_name",
      label: "Transaction Name",
    },
    {
      key: "transaction_type",
      label: "Transaction Type",
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "property_id",
      label: "Property",
    },
    {
      key: "purchase_price",
      label: "Purchase Price",
    },
    {
      key: "sale_price",
      label: "Sale Price",
    },
    {
      key: "assignment_fee",
      label: "Assignment Fee",
    },
    {
      key: "closing_date",
      label: "Closing Date",
    },
  ] as const;

  const changes = trackedFields.filter(({ key }) => {
    return existingTransaction[key] !== params[key];
  });

  console.log("Detected changes:", changes);

  // Update transaction
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      transaction_name: params.transaction_name,

      transaction_type: params.transaction_type,

      status: params.status,

      property_id: params.property_id,

      purchase_price: params.purchase_price,

      sale_price: params.sale_price,

      assignment_fee: params.assignment_fee,

      closing_date: params.closing_date,
    })
    .eq("id", params.transactionId)
    .eq("organization_id", membership.organization_id);

  if (updateError) {
    console.error("Transaction update error:", updateError);

    throw new Error(updateError.message || JSON.stringify(updateError));
  }

  // Log field changes
  for (const change of changes) {
    console.log("Logging activity for:", change);

    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({
        organization_id: membership.organization_id,

        entity_type: "transaction",

        entity_id: params.transactionId,

        activity_type: "field_updated",

        description: `${change.label} changed`,

        created_by: user.id,

        metadata: {
          field: change.key,

          oldValue: existingTransaction[change.key],

          newValue: params[change.key],
        },
      });

    if (activityError) {
      console.error("Activity log insert error:", activityError);
    }
  }

  // Refresh transaction pages
  revalidatePath(`/transactions/${params.transactionId}`);

  revalidatePath("/transactions");

  revalidatePath("/pipeline");

  return {
    success: true,
  };
}
