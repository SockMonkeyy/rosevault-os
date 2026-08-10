"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CampaignService } from "@/app/services/email/campaignService";

export async function sendCampaign(campaignId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const campaignService = new CampaignService();

    const result =
      await campaignService.sendCampaign(campaignId);

    revalidatePath("/marketing");
    revalidatePath("/marketing/campaigns");
    revalidatePath("/marketing/compose");

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      sent: 0,
      failed: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected error sending campaign.",
    };
  }
}