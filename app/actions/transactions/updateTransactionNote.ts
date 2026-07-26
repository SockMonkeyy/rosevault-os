"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface UpdateTransactionNoteParams {
  noteId: string;
  transactionId: string;
  note: string;
}

export async function updateTransactionNote({
  noteId,
  transactionId,
  note,
}: UpdateTransactionNoteParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the user's current organization membership for tenant scoping
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Unauthorized organization access.");
  }

  console.log("Updating note:", { noteId, note });

const { data, error } = await supabase
  .from("transaction_notes")
  .update({
    note,
  })
  .eq("id", noteId)
  .select();

  if (error) {
    console.error(error);
    throw new Error("Failed to update note.");
  }

  revalidatePath(`/transactions/${transactionId}`);
}