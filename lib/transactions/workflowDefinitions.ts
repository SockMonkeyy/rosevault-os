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

export const TRANSACTION_WORKFLOWS: Record<string, WorkflowDefinition> = {
  lead: {
    stage: "lead",
    title: "Lead / Prospect",
    description: "Initial inquiry and qualification",
    nextStage: "offer_made",
    checklist: [
      {
        id: "contact_created",
        title: "Contact Created",
        required: true,
        autoComplete: true,
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

  offer_made: {
    stage: "offer_made",
    title: "Offer Made",
    description: "Submit the offer and await seller response",
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
    description: "Purchase agreement executed",
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
    title: "Inspection Period",
    description: "Property inspections and negotiations",
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
    title: "Appraisal & Title",
    description: "Appraisal, title work, and contingencies",
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
    title: "Loan Commitment",
    description: "Financing approval and underwriting",
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
    title: "Closing / Settlement",
    description: "Final walkthrough and closing",
    nextStage: "closed",
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

  due_diligence: {
    stage: "due_diligence",
    title: "Due Diligence",
    description: "Review property documentation, disclosures, and contingencies.",
    nextStage: "inspection", // or whichever stage comes next in your workflow
    checklist: [
      {
        id: "disclosures_reviewed",
        title: "Disclosures Reviewed",
        required: true,
        autoComplete: false,
      },
    ],
    requiredDocuments: [],
  },

  clear_to_close: {
    stage: "clear_to_close",
    title: "Clear to Close",
    description: "Loan fully approved and final closing details being prepared.",
    nextStage: "closing",
    checklist: [
      {
        id: "final_cd_issued",
        title: "Final Closing Disclosure Issued",
        required: true,
        autoComplete: false,
      },
    ],
    requiredDocuments: [
      {
        id: "final_clear_to_close_doc",
        title: "Clear to Close Letter",
        required: true,
      },
    ],
  },

  closed: {
    stage: "closed",
    title: "Closed",
    description: "Transaction successfully completed and archived",
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