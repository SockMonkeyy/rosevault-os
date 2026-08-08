"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/logActivity";

export async function createTransactionNote(
  transactionId: string,
  note: string,
) {
  console.log("=== createTransactionNote called ===");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Organization not found.");
  }

  console.log({
    organization_id: membership.organization_id,
    transaction_id: transactionId,
    note,
    created_by: user.id,
  });

  const { data, error } = await supabase
    .from("transaction_notes")
    .insert({
      organization_id: membership.organization_id,
      transaction_id: transactionId,
      note,
      created_by: user.id,
    })
    .select();
  console.log("Insert result:", { data, error });

  if (error) {
    console.error("Transaction Note Insert Error:", error);

    throw new Error(
      `${error.message}\n${error.details ?? ""}\n${error.hint ?? ""}`,
    );
  }
  await logActivity({
    organizationId: membership.organization_id,
    entityType: "transaction",
    entityId: transactionId,
    transactionId: transactionId,
    activityType: "note_added",
    description: "Added a transaction note",
    createdBy: user.id,
  });
  
  revalidatePath(`/transactions/${transactionId}`);
}
