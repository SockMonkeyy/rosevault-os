import { TransactionStage } from "./stages";

export interface WorkflowChecklistItem {
  id: string;
  title: string;
  required: boolean;
  autoComplete: boolean;
}

export interface WorkflowDocument {
  id: string;
  title: string;
  required: boolean;
}

export interface WorkflowDefinition {
  stage: string;

  title: string;

  description: string;

  nextStage?: string;

  checklist: WorkflowChecklistItem[];

  requiredDocuments: WorkflowDocument[];
}

export const TRANSACTION_WORKFLOWS: Record<string, WorkflowDefinition> = {
  lead: {
    stage: "lead",

    title: "Lead",

    description:
      "Qualify the lead and gather enough information to move toward an offer.",

    nextStage: "under_contract",

    checklist: [
      {
        id: "contact_created",
        title: "Contact Created",
        required: true,
        autoComplete: true,
      },
      {
        id: "property_identified",
        title: "Property Identified",
        required: true,
        autoComplete: false,
      },
      {
        id: "initial_consultation",
        title: "Initial Consultation",
        required: true,
        autoComplete: false,
      },
    ],

    requiredDocuments: [],
  },

  // Add the missing stage here
  offer_made: {
    stage: "offer_made",
    title: "Offer Made",
    description: "Submit the offer and await seller response.",
    nextStage: "under_contract",
    checklist: [
      {
        id: "offer_submitted",
        title: "Offer Submitted",
        required: true,
        autoComplete: false,
      },
    ],
    requiredDocuments: [
      {
        id: "submitted_offer",
        title: "Submitted Offer Document",
        required: true,
      },
    ],
  },

  under_contract: {
    stage: "under_contract",

    title: "Under Contract",

    description:
      "Execute the purchase agreement and begin the contract process.",

    nextStage: "inspection",

    checklist: [
      {
        id: "purchase_agreement",
        title: "Purchase Agreement Signed",
        required: true,
        autoComplete: false,
      },
      {
        id: "earnest_money",
        title: "Earnest Money Received",
        required: true,
        autoComplete: true,
      },
    ],

    requiredDocuments: [
      {
        id: "purchase_contract",
        title: "Purchase Agreement",
        required: true,
      },
    ],
  },

  inspection: {
    stage: "inspection",

    title: "Inspection",

    description: "Complete inspections and negotiate repairs if needed.",

    nextStage: "appraisal",

    checklist: [
      {
        id: "inspection_ordered",
        title: "Inspection Ordered",
        required: true,
        autoComplete: false,
      },
      {
        id: "inspection_completed",
        title: "Inspection Completed",
        required: true,
        autoComplete: false,
      },
    ],

    requiredDocuments: [
      {
        id: "inspection_report",
        title: "Inspection Report",
        required: true,
      },
    ],
  },

  appraisal: {
    stage: "appraisal",

    title: "Appraisal",

    description: "Complete appraisal, title work, and contingency review.",

    nextStage: "financing",

    checklist: [
      {
        id: "appraisal_ordered",
        title: "Appraisal Ordered",
        required: true,
        autoComplete: false,
      },
      {
        id: "title_work_started",
        title: "Title Work Started",
        required: true,
        autoComplete: false,
      },
    ],

    requiredDocuments: [
      {
        id: "title_commitment",
        title: "Title Commitment",
        required: true,
      },
      {
        id: "appraisal_report",
        title: "Appraisal Report",
        required: true,
      },
    ],
  },

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
};
