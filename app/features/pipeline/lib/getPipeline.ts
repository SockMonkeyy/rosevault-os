import { createClient } from "@/lib/supabase/server";

import { TRANSACTION_STAGES } from "@/lib/transactions/stages";

import { PipelineColumn } from "../types";

export async function getPipeline(
  organizationId: string,
): Promise<PipelineColumn[]> {
  const supabase = await createClient();

  const { data: transactions, error } =
    await supabase
      .from("transactions")
      .select(`
        id,
        transaction_name,
        property_id,
        purchase_price,
        closing_date,
        status
      `)
      .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  const columns: PipelineColumn[] =
    TRANSACTION_STAGES.map((stage) => ({
      id: stage.id,
      title: stage.label,
      cards: [],
      totalDeals: 0,
      totalValue: 0,
    }));

  for (const transaction of transactions ?? []) {
    const column =
      columns.find(
        (c) => c.id === transaction.status,
      );

    if (!column) continue;

    column.cards.push({
      id: transaction.id,

      transactionName:
        transaction.transaction_name,

      propertyAddress: null,

      stage: transaction.status,

      purchasePrice:
        transaction.purchase_price,

      closingDate:
        transaction.closing_date,

      assignedAgent: null,

      workflowPercent: 0,

      workflowHealth: "good",

      checklistRemaining: 0,

      documentsRemaining: 0,
    });

    column.totalDeals++;

    column.totalValue +=
      transaction.purchase_price ?? 0;
  }

  return columns;
}