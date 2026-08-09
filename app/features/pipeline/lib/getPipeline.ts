import { createClient } from "@/lib/supabase/server";

import { TRANSACTION_STAGES } from "@/lib/transactions/stages";

import { getTransactionPipelineValue } from "@/lib/transactions/getTransactionPipelineValue";

import { PipelineColumn } from "../types";

export async function getPipeline(
  organizationId: string,
): Promise<PipelineColumn[]> {
  const supabase = await createClient();

  const {
    data: transactions,
    error,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_name,
      property_id,
      transaction_type,
      purchase_price,
      sale_price,
      assignment_fee,
      closing_date,
      status
    `)
    .eq(
      "organization_id",
      organizationId,
    );

  if (error) {
    throw error;
  }

  const columns: PipelineColumn[] =
    TRANSACTION_STAGES.map(
      (stage) => ({
        id: stage.id,

        title: stage.label,

        cards: [],

        totalDeals: 0,

        totalValue: 0,
      }),
    );

  for (const transaction of
    transactions ?? []) {
    const column =
      columns.find(
        (item) =>
          item.id ===
          transaction.status,
      );

    if (!column) {
      continue;
    }

    const pipelineValue =
      getTransactionPipelineValue(
        transaction,
      );

    const daysUntilClosing =
      transaction.closing_date
        ? Math.ceil(
            (new Date(
              transaction.closing_date,
            ).getTime() -
              Date.now()) /
              86400000,
          )
        : undefined;

    column.cards.push({
      id: transaction.id,

      transactionName:
        transaction.transaction_name,

      propertyAddress: null,

      stage:
        transaction.status,

      purchasePrice:
        transaction.purchase_price,

      salePrice:
        transaction.sale_price,

      assignmentFee:
        transaction.assignment_fee,

      closingDate:
        transaction.closing_date,

      assignedAgent: null,

      workflowPercent: 0,

      workflowHealth: "good",

      checklistRemaining: 0,

      documentsRemaining: 0,

      transactionType:
        transaction.transaction_type,

      priority: "medium",

      pipelineValue,

      daysUntilClosing,
    });

    column.totalDeals += 1;

    column.totalValue +=
      pipelineValue;
  }

  return columns;
}