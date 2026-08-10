"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { campaignService } from "@/app/services/email/campaignService";

export interface SaveCampaignDraftInput {
  campaignId?: string;
  organizationId: string;
  userId: string;
  campaignName: string;
  subject: string;
  body: string;
  templateId?: string | null;
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
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("SERVER ACTION USER:", user);
  console.log("INPUT:", input);

  if (error || !user) {
    throw new Error("No authenticated user.");
  }

  const campaign = await campaignService.saveDraft(input);

  revalidatePath("/marketing/campaigns");
  revalidatePath("/marketing/compose");

  return campaign;
}