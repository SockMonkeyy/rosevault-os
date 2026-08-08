export interface PipelineCard {
  id: string;

  transactionName: string;

  propertyAddress: string | null;

  stage: string;

  purchasePrice: number | null;

  closingDate: string | null;

  assignedAgent: string | null;

  workflowPercent: number;

  workflowHealth:
    | "healthy"
    | "good"
    | "warning"
    | "attention";

  checklistRemaining: number;

  documentsRemaining: number;

  transactionType?: string;

  priority?: "low" | "medium" | "high";

  daysUntilClosing?: number;
}

export interface PipelineColumn {
  id: string;

  title: string;

  cards: PipelineCard[];

  totalValue: number;

  totalDeals: number;
}