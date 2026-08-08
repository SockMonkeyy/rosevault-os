import { createClient } from "@/lib/supabase/server";
import { ensureChecklistForStage } from "./workflow";
import { logActivity } from "@/lib/activity/logActivity";
import { ActivityType } from "@/lib/activity/types";
import { TRANSACTION_WORKFLOWS } from "./workflowDefinitions";
import { TransactionStage } from "./stages";

export async function moveTransactionToStage(
  transactionId: string,
  stage: TransactionStage,
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

  const previousStage = transaction.status as TransactionStage;

  if (previousStage === stage) {
    return;
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status: stage,
    })
    .eq("id", transactionId);

  if (updateError) {
    throw updateError;
  }

  await ensureChecklistForStage(
    transaction.organization_id,
    transactionId,
    stage,
  );

  // Safely fallback to the raw stage key string if workflow definition is missing
  const previousTitle = 
    TRANSACTION_WORKFLOWS[previousStage]?.title ?? previousStage;
  const nextTitle = 
    TRANSACTION_WORKFLOWS[stage]?.title ?? stage;

  await logActivity({
    organizationId: transaction.organization_id,
    transactionId: transactionId,
    activityType: ActivityType.STAGE_ADVANCED,
    description: `${previousTitle} → ${nextTitle}`,
    entityType: "transaction",
    entityId: transactionId,
    createdBy: "",
  });
}