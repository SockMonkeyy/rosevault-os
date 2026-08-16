"use server";

import { revalidatePath } from "next/cache";
import {
  campaignService,
} from "@/app/services/email/campaignService";

export interface SaveCampaignDraftInput {
  campaignId?: string;

  organizationId: string;

  userId: string;

  campaignName: string;

  subject: string;

  body: string;

  templateId?: string | null;

  campaignStage?: string;

  stageOrder?: number;

  recipients: {
    contactId: string;

    email: string;

    firstName: string | null;

    lastName: string | null;
  }[];
}

export async function saveCampaignDraft(
  input: SaveCampaignDraftInput,
) {
  try {
    const campaign =
      await campaignService.saveDraft(
        input,
      );

    revalidatePath(
      "/marketing/campaigns",
    );

    revalidatePath(
      "/email/compose",
    );

    return campaign;
  } catch (error) {
    console.error(
      "SAVE DRAFT ERROR:",
      error,
    );

    throw error;
  }
}