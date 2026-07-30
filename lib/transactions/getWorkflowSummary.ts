import { createClient } from "@/lib/supabase/server";
import { TRANSACTION_WORKFLOWS } from "./workflowDefinitions";
import { TransactionStage } from "./stages";

export async function getWorkflowSummary(
  transactionId: string,
  stage: TransactionStage,
) {
  const supabase = await createClient();

  const workflow =
    TRANSACTION_WORKFLOWS[stage];

  const { data: checklist } = await supabase
    .from("transaction_checklist_items")
    .select("title, completed")
    .eq("transaction_id", transactionId);

  const completedTasks =
    checklist?.filter((item) => item.completed)
      .length ?? 0;

  const totalTasks =
    checklist?.length ?? 0;

  const remainingTasks =
    checklist
      ?.filter((item) => !item.completed)
      .map((item) => item.title) ?? [];

  return {
    stageTitle: workflow.title,

    nextStage: workflow.nextStage
      ? TRANSACTION_WORKFLOWS[
          workflow.nextStage
        ].title
      : undefined,

    completedTasks,

    totalTasks,

    uploadedDocuments: 0,

    requiredDocuments:
      workflow.requiredDocuments.length,

    remainingTasks,
  };
}