import { createClient } from "@/lib/supabase/server";

import {
  TRANSACTION_WORKFLOWS,
} from "@/lib/transactions/workflowDefinitions";

export async function getDocumentMetrics(
  transactionId: string,
  stage: string,
) {
  const supabase = await createClient();

  const workflow =
    TRANSACTION_WORKFLOWS[
      stage as keyof typeof TRANSACTION_WORKFLOWS
    ];

  const required =
    workflow?.requiredDocuments.length ??
    0;

  const { count } = await supabase
    .from("transaction_documents")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("transaction_id", transactionId);

  const uploaded = count ?? 0;

  return {
    uploadedDocuments: uploaded,

    documentsRemaining:
      Math.max(
        required - uploaded,
        0,
      ),
  };
}