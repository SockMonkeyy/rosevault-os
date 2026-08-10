"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteTransactionDocument(
  documentId: string,
  transactionId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  // Get document information
  const { data: document, error: documentError } = await supabase
    .from("transaction_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    throw new Error("Document not found.");
  }

  // Remove file from Storage
  const { error: storageError } = await supabase.storage
    .from("transaction-documents")
    .remove([document.storage_path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  // Remove database record
  const { error: deleteError } = await supabase
    .from("transaction_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  // Activity Log
  await supabase.from("activity_log").insert({
    organization_id: document.organization_id,
    transaction_id: transactionId,
    activity_type: "document_deleted",
    description: `Deleted document: ${document.file_name}`,
    user_id: user.id,
  });

  revalidatePath(`/transactions/${transactionId}`);

  return { success: true };
}