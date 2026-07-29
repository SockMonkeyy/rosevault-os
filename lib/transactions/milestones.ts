export const TRANSACTION_MILESTONE_KEYS = [
  "lead",
  "under_contract",
  "earnest_money",
  "inspection",
  "appraisal",
  "financing",
  "closing_scheduled",
  "closed",
] as const;

export type TransactionMilestoneKey =
  (typeof TRANSACTION_MILESTONE_KEYS)[number];

export type TransactionMilestone = {
  key: TransactionMilestoneKey;
  title: string;
  description: string;
};

export const TRANSACTION_MILESTONES: TransactionMilestone[] = [
  {
    key: "lead",
    title: "Lead",
    description: "Initial client inquiry",
  },
  {
    key: "under_contract",
    title: "Under Contract",
    description: "Purchase agreement executed",
  },
  {
    key: "earnest_money",
    title: "Earnest Money",
    description: "Earnest money received",
  },
  {
    key: "inspection",
    title: "Inspection",
    description: "Property inspection",
  },
  {
    key: "appraisal",
    title: "Appraisal",
    description: "Property appraisal",
  },
  {
    key: "financing",
    title: "Financing",
    description: "Loan approval",
  },
  {
    key: "closing_scheduled",
    title: "Closing Scheduled",
    description: "Closing date confirmed",
  },
  {
    key: "closed",
    title: "Closed",
    description: "Transaction complete",
  },
];