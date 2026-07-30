"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  TRANSACTION_WORKFLOWS,
} from "@/lib/transactions/workflowDefinitions";

import { TransactionStage } from "@/lib/transactions/stages";

import { ensureChecklistForStage } from "@/lib/transactions/workflow";

export async function advanceTransactionStage(
  transactionId: string,
) {
  const supabase = await createClient();

  const {
    data: transaction,
    error,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      organization_id,
      status
    `)
    .eq("id", transactionId)
    .single();

  if (error || !transaction) {
    throw new Error("Transaction not found.");
  }

  const currentStage =
    transaction.status as TransactionStage;

  const workflow =
    TRANSACTION_WORKFLOWS[currentStage];

  if (!workflow?.nextStage) {
    return;
  }

  const nextStage =
    workflow.nextStage;

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status: nextStage,
    })
    .eq("id", transactionId);

  if (updateError) {
    throw updateError;
  }

  await ensureChecklistForStage(
    transaction.organization_id,
    transactionId,
    nextStage,
  );

  revalidatePath(
    `/transactions/${transactionId}`,
  );
}