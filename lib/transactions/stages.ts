export const TRANSACTION_STAGES = [
  {
    id: "lead",
    label: "Lead / Prospect",
    description: "Initial inquiry and qualification",
  },
  {
    id: "under_contract",
    label: "Under Contract",
    description: "Purchase agreement executed",
  },
  {
    id: "inspection",
    label: "Inspection Period",
    description: "Property inspections and negotiations",
  },
  {
    id: "appraisal",
    label: "Appraisal & Title",
    description: "Appraisal, title work, and contingencies",
  },
  {
    id: "financing",
    label: "Loan Commitment",
    description: "Financing approval and underwriting",
  },
  {
    id: "closing",
    label: "Closing / Settlement",
    description: "Final walkthrough and closing",
  },
] as const;

export type TransactionStage =
  (typeof TRANSACTION_STAGES)[number]["id"];