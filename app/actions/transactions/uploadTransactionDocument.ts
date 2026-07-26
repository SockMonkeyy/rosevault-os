"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadTransactionDocument() {
  const supabase = await createClient();

  // We'll build this step-by-step.
}