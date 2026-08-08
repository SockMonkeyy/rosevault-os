"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  moveTransactionToStage,
} from "@/lib/transactions/workflowEngine";

import {
  TRANSACTION_WORKFLOWS,
} from "@/lib/transactions/workflowDefinitions";

import {
  TransactionStage,
} from "@/lib/transactions/stages";

export async function advanceTransactionStage(
  transactionId: string,
) {
  const supabase = await createClient();

  const {
    data: transaction,
    error,
  } = await supabase
    .from("transactions")
    .select("status")
    .eq("id", transactionId)
    .single();

  if (error || !transaction) {
    throw new Error("Transaction not found.");
  }

  const currentStage =
    transaction.status as TransactionStage;

  const nextStage =
    TRANSACTION_WORKFLOWS[currentStage]
      ?.nextStage;

  if (!nextStage) {
    return;
  }

  await moveTransactionToStage(
    transactionId,
    nextStage,
  );

  revalidatePath(
    `/transactions/${transactionId}`,
  );
}