"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadTransactionDocument(
  transactionId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file was uploaded.");
  }

  const extension = file.name.split(".").pop();

  const fileName = `${crypto.randomUUID()}.${extension}`;

  const storagePath = `${transactionId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("transaction-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Organization membership not found.");
  }

  const { error: insertError } = await supabase
    .from("transaction_documents")
    .insert({
      organization_id: membership.organization_id,
      transaction_id: transactionId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    });

  if (insertError) {
    // Roll back the uploaded file if the database insert fails.
    await supabase.storage
      .from("transaction-documents")
      .remove([storagePath]);

    throw new Error(insertError.message);
  }

  // 1. Log the Activity
  await supabase.from("activity_log").insert({
    organization_id: membership.organization_id,
    transaction_id: transactionId,
    activity_type: "document_uploaded",
    description: `Uploaded document: ${file.name}`,
    created_by: user.id,
  });

  // 2. Revalidate the Transaction Page
  revalidatePath(`/transactions/${transactionId}`);

  // 3. Return Success
  return {
    success: true,
  };
}