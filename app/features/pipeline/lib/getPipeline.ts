import { createClient } from "@/lib/supabase/server";

import { TRANSACTION_STAGES } from "@/lib/transactions/stages";

import { PipelineColumn } from "../types";

import { mapTransactionToPipelineCard } from "./mapTransactionToPipelineCard";

import { getPipelineMetrics } from "./getPipelineMetrics";

import { getDocumentMetrics } from "./getDocumentMetrics";

export async function getPipeline(
  organizationId: string,
): Promise<PipelineColumn[]> {
  const supabase = await createClient();

  // -----------------------------
  // Load Transactions
  // -----------------------------

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select(
      `
      id,
      transaction_name,
      transaction_type,
      purchase_price,
      closing_date,
      property_id,
      status
    `,
    )
    .eq("organization_id", organizationId);

  if (transactionError) {
    throw transactionError;
  }

  // -----------------------------
  // Load Properties
  // -----------------------------

  const propertyIds = [
    ...new Set((transactions ?? []).map((t) => t.property_id).filter(Boolean)),
  ];

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select(
            `
            id,
            property_address_line_1,
            property_city,
            property_state
          `,
          )
          .in("id", propertyIds)
      : { data: [] };

  const propertyMap = new Map(
    (properties ?? []).map((property) => [property.id, property]),
  );

  // -----------------------------
  // Build Columns
  // -----------------------------

  const columns: PipelineColumn[] = TRANSACTION_STAGES.map((stage) => ({
    id: stage.id,
    title: stage.label,
    cards: [],
    totalDeals: 0,
    totalValue: 0,
  }));

  // -----------------------------
  // Build Cards
  // -----------------------------

  for (const transaction of transactions ?? []) {
    const workflow = await getPipelineMetrics(transaction.id);

    const documents = await getDocumentMetrics(
      transaction.id,
      transaction.status,
    );

    const property = propertyMap.get(transaction.property_id);

    const propertyAddress = property
      ? `${property.property_address_line_1},
${property.property_city}, ${property.property_state}`
      : null;

    const validWorkflowHealthes = [
      "healthy",
      "good",
      "warning",
      "attention",
    ] as const;

    type WorkflowHealth = (typeof validWorkflowHealthes)[number];

    const workflowHealth = validWorkflowHealthes.includes(
      workflow.workflowHealth as WorkflowHealth,
    )
      ? (workflow.workflowHealth as WorkflowHealth)
      : "attention";

    const card = mapTransactionToPipelineCard({
      ...transaction,

      propertyAddress,

      assignedAgent: null,

      workflowPercent: workflow.workflowPercent,

      workflowHealth,

      checklistRemaining: workflow.checklistRemaining,

      documentsRemaining: documents.uploadedDocuments,
    });

    const column = columns.find((c) => c.id === transaction.status);

    if (!column) continue;

    column.cards.push(card);

    column.totalDeals++;

    column.totalValue += transaction.purchase_price ?? 0;
  }

  return columns;
}
