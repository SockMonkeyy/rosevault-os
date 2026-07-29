"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTransactionDocumentUrl(
  storagePath: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const { data, error } = await supabase.storage
    .from("transaction-documents")
    .createSignedUrl(storagePath, 300);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}