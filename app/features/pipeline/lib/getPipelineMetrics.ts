import { createClient } from "@/lib/supabase/server";

import { getWorkflowHealth } from "@/lib/transactions/getWorkflowHealth";

export async function getPipelineMetrics(
  transactionId: string,
) {
  const supabase = await createClient();

  const { data: checklist } = await supabase
    .from("transaction_checklist_items")
    .select("completed")
    .eq("transaction_id", transactionId);

  const total =
    checklist?.length ?? 0;

  const completed =
    checklist?.filter(
      (item) => item.completed,
    ).length ?? 0;

  const workflowPercent =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100,
        );

  const workflow =
    await getWorkflowHealth(
      transactionId,
    );

  return {
    workflowPercent,

    workflowHealth:
      workflow.status,

    checklistRemaining:
      total - completed,
  };
}