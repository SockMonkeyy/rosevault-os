// Minimal local WorkflowDefinition to avoid missing './types' import errors
// This mirrors the shape expected by this file and keeps the file self-contained.
export type WorkflowChecklistItem = {
  id: string;
  title: string;
  required?: boolean;
  autoComplete?: boolean;
};

export type WorkflowDocument = {
  id: string;
  title: string;
  required?: boolean;
};

export type WorkflowDefinition = {
  stage: string;
  title: string;
  description?: string;
  nextStage?: string;
  checklist?: WorkflowChecklistItem[];
  requiredDocuments?: WorkflowDocument[];
};

// Add the missing "closed" entry inside your TRANSACTION_WORKFLOWS map, 
// and update "closing"'s nextStage to "closed" so the transition works correctly.

export const TRANSACTION_WORKFLOWS: Record<string, WorkflowDefinition> = {
  // ... (keep all your existing stages up to financing) ...

  financing: {
    stage: "financing",
    title: "Financing",
    description: "Finalize financing approval before closing.",
    nextStage: "closing",
    checklist: [
      {
        id: "loan_approved",
        title: "Loan Approved",
        required: true,
        autoComplete: false,
      },
      {
        id: "closing_scheduled",
        title: "Closing Scheduled",
        required: true,
        autoComplete: false,
      },
    ],
    requiredDocuments: [
      {
        id: "clear_to_close",
        title: "Clear To Close",
        required: true,
      },
    ],
  },

  closing: {
    stage: "closing",
    title: "Closing",
    description: "Complete the transaction and archive the deal.",
    nextStage: "closed", // <-- Point to the final terminal stage
    checklist: [
      {
        id: "closing_completed",
        title: "Closing Completed",
        required: true,
        autoComplete: false,
      },
      {
        id: "documents_archived",
        title: "Documents Archived",
        required: true,
        autoComplete: false,
      },
    ],
    requiredDocuments: [
      {
        id: "closing_disclosure",
        title: "Closing Disclosure",
        required: true,
      },
      {
        id: "signed_settlement_statement",
        title: "Signed Settlement Statement",
        required: true,
      },
    ],
  },

  closed: {
    stage: "closed",
    title: "Closed",
    description: "Transaction successfully completed and archived.",
    // No nextStage since it's the final state
    checklist: [
      {
        id: "transaction_finalized",
        title: "Transaction Finalized",
        required: true,
        autoComplete: true,
      },
    ],
    requiredDocuments: [],
  },
};