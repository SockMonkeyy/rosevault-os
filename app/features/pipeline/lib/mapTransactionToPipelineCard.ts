import { PipelineCard } from "../types";

interface TransactionRecord {
  id: string;
  transaction_name: string;
  transaction_type: string | null;
  purchase_price: number | null;
  closing_date: string | null;
  status: string;

  propertyAddress: string | null;

  workflowPercent: number;

  workflowHealth:
    | "healthy"
    | "good"
    | "warning"
    | "attention";

  checklistRemaining: number;

  documentsRemaining: number;

  assignedAgent: string | null;
}

export function mapTransactionToPipelineCard(
  transaction: TransactionRecord,
): PipelineCard {
  const daysUntilClosing =
    transaction.closing_date
      ? Math.ceil(
          (new Date(transaction.closing_date).getTime() -
            Date.now()) /
            86400000,
        )
      : undefined;

  let priority: "low" | "medium" | "high" =
    "medium";

  if (
    daysUntilClosing !== undefined &&
    daysUntilClosing <= 7
  ) {
    priority = "high";
  }

  return {
    id: transaction.id,

    transactionName: transaction.transaction_name,

    propertyAddress: transaction.propertyAddress,

    transactionType: transaction.transaction_type ?? undefined,

    stage: transaction.status,

    purchasePrice: transaction.purchase_price,
    salePrice: null,
    assignmentFee: null,
    pipelineValue: 0,

    closingDate: transaction.closing_date,

    assignedAgent: transaction.assignedAgent,

    workflowPercent: transaction.workflowPercent,

    workflowHealth: transaction.workflowHealth,

    checklistRemaining: transaction.checklistRemaining,

    documentsRemaining: transaction.documentsRemaining,

    priority,

    daysUntilClosing,
  };
}