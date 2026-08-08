"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/logActivity";

interface DeleteTransactionNoteParams {
  noteId: string;
  transactionId: string;
}

export async function deleteTransactionNote({
  noteId,
  transactionId,
}: DeleteTransactionNoteParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Unauthorized organization access.");
  }

  const { error } = await supabase
    .from("transaction_notes")
    .delete()
    .eq("id", noteId)
    .eq("organization_id", membership.organization_id);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete note.");
  }

  await logActivity({
    organizationId: membership.organization_id,
    transactionId: transactionId, // <-- Added required transactionId
    entityType: "transaction",
    entityId: transactionId,
    activityType: "note_deleted", // Or whatever activity type you are using here
    description: "Deleted a transaction note",
    createdBy: user.id, // Keep whatever creator/metadata fields you had
  });

  revalidatePath(`/transactions/${transactionId}`);
}