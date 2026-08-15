export const TRANSACTION_STAGES = [
  {
    id: "lead",
    label: "Lead / Prospect",
    description: "Initial inquiry and qualification",
  },
  {
    id: "offer_made",
    label: "Offer Made",
    description: "Submit the offer and await seller response",
  },
  {
    id: "under_contract",
    label: "Under Contract",
    description: "Purchase agreement executed",
  },

  {
    id: "draft",
    label: "Draft",
    description: "Transaction being drafted before active lead status",
  },
  {
    id: "lead",
    label: "Lead / Prospect",
    description: "Initial inquiry and qualification",
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
  {
    id: "closed",
    label: "Closed",
    description: "Transaction successfully completed and archived",
  },
] as const;

export type TransactionStage = (typeof TRANSACTION_STAGES)[number]["id"];
