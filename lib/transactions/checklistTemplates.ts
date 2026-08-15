import { TransactionStage } from "./stages";

export interface ChecklistItemTemplate {
  id: string;
  title: string;
  required: boolean;
  autoComplete: boolean;
}

export const TRANSACTION_CHECKLISTS: Record<
  TransactionStage,
  ChecklistItemTemplate[]
> = {
  lead: [
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

  offer_made: [
    {
      id: "offer_submitted",
      title: "Offer Submitted",
      required: true,
      autoComplete: false,
    },
  ],

  under_contract: [
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

  inspection: [],

  appraisal: [],

  financing: [],

  closing: [],

  closed: [
    {
      id: "transaction_finalized",
      title: "Transaction Finalized",
      required: true,
      autoComplete: true,
    },
  ],
};