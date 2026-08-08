"use server";

import { revalidatePath } from "next/cache";

import { moveTransactionToStage } from "@/lib/transactions/workflowEngine";

import { TransactionStage } from "@/lib/transactions/stages";

export async function moveTransaction(
  transactionId: string,
  stage: TransactionStage,
) {
  await moveTransactionToStage(
    transactionId,
    stage,
  );

  revalidatePath("/pipeline");

  revalidatePath(`/transactions/${transactionId}`);
}