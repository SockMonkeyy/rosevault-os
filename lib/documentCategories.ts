export const DOCUMENT_CATEGORIES = [
  "Purchase Agreement",
  "Inspection",
  "Offer",
  "Contract",
  "Appraisal",
  "Disclosures",
  "Title",
  "Insurance",
  "Financing",
  "Repair Estimate",
  "Invoice",
  "Closing",
  "Other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];