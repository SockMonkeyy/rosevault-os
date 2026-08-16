import { personalizeText } from "@/app/components/email/BulkEmailComposer/personalize";
import { emailService } from "./emailService";
import { campaignRepository } from "@/app/repositories/email/campaignRepository";
import { SaveCampaignDraftInput } from "@/app/actions/email/saveCampaignDraft";

export class CampaignService {
  // ============================================================
  // SEND CAMPAIGN
  // ============================================================

  async sendCampaign(campaignId: string) {
    const campaign = await campaignRepository.getCampaign(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    if (campaign.status === "sent") {
      throw new Error("This campaign has already been sent.");
    }

    const recipients = await campaignRepository.getRecipients(campaignId);

    if (recipients.length === 0) {
      throw new Error("This campaign has no recipients.");
    }

    const { createClient } = await import("@/lib/supabase/server");

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const startedAt = new Date().toISOString();

    const { data: sendHistory, error: historyError } = await supabase
      .from("email_campaign_sends")
      .insert({
        campaign_id: campaignId,
        organization_id: campaign.organization_id,
        sent_by: user.id,
        status: "sending",
        recipient_count: recipients.length,
        sent_count: 0,
        failed_count: 0,
        started_at: startedAt,
      })
      .select("*")
      .single();

    if (historyError || !sendHistory) {
      throw new Error(
        historyError?.message ?? "Unable to create campaign send history.",
      );
    }

    // ----------------------------------------------------------
    // Determine template information
    // ----------------------------------------------------------

    let templateName = campaign.last_template_name ?? null;

    if (campaign.template_id && !templateName) {
      const supabase = await import("@/lib/supabase/server").then((module) =>
        module.createClient(),
      );

      const { data: template } = await supabase
        .from("email_templates")
        .select("id, name")
        .eq("id", campaign.template_id)
        .maybeSingle();

      templateName = template?.name ?? null;
    }

    // ----------------------------------------------------------
    // Mark campaign as sending
    // ----------------------------------------------------------

    await campaignRepository.updateCampaignStatus(campaignId, "sending");

    let sent = 0;
    let failed = 0;

    // ----------------------------------------------------------
    // Send each recipient
    // ----------------------------------------------------------

    for (const recipient of recipients) {
      try {
        await emailService.sendEmail({
          to: [recipient.email],

          subject: personalizeText(campaign.subject, recipient),

          html: personalizeText(campaign.body, recipient),

          text: personalizeText(campaign.body, recipient),
        });

        sent++;

        await campaignRepository.updateRecipientStatus(recipient.id, "sent");
      } catch (error) {
        failed++;

        console.error("Unexpected send error:", recipient.email, error);

        await campaignRepository.updateRecipientStatus(recipient.id, "failed");
      }
    }

    const completedAt = new Date().toISOString();
    const finalStatus = failed === 0 ? "sent" : "failed";

    // ----------------------------------------------------------
    // Update history row
    // ----------------------------------------------------------

    const { error: historyUpdateError } = await supabase
      .from("email_campaign_sends")
      .update({
        status: finalStatus,
        sent_count: sent,
        failed_count: failed,
        completed_at: completedAt,
      })
      .eq("id", sendHistory.id);

    if (historyUpdateError) {
      throw new Error(historyUpdateError.message);
    }

    // ----------------------------------------------------------
    // Update campaign tracking
    // ----------------------------------------------------------

    await campaignRepository.updateCampaignStatus(campaignId, finalStatus, {
      sent_at: completedAt,

      last_template_id: campaign.template_id ?? null,

      last_template_name: templateName,

      campaign_stage: campaign.campaign_stage ?? "Introduction",

      stage_order: campaign.stage_order ?? 1,
    });

    return {
      sent,
      failed,
      status: finalStatus,
      stage: campaign.campaign_stage ?? "Introduction",
      stageOrder: campaign.stage_order ?? 1,
      templateId: campaign.template_id ?? null,
      templateName,
    };
  }

  // ============================================================
  // SAVE DRAFT
  // ============================================================

  async saveDraft(input: SaveCampaignDraftInput) {
    const recipientCount = input.recipients.length;

    const draftInput = input as SaveCampaignDraftInput & {
      campaignStage?: string;
      stageOrder?: number;
    };

    const campaignStage = draftInput.campaignStage ?? "Introduction";

    const stageOrder = draftInput.stageOrder ?? 1;

    // ----------------------------------------------------------
    // CREATE / UPDATE CAMPAIGN
    // ----------------------------------------------------------

    let campaignId = input.campaignId;

    let campaign;

    const templateName = input.templateId
      ? await this.getTemplateName(input.templateId)
      : null;

    if (campaignId) {
      campaign = await campaignRepository.updateCampaign(campaignId, {
        organization_id: input.organizationId,

        user_id: input.userId,

        created_by: input.userId,

        name: input.campaignName,

        campaign_name: input.campaignName,

        subject: input.subject,

        body: input.body,

        template_id: input.templateId ?? null,

        status: "draft",

        recipient_count: recipientCount,

        campaign_stage: campaignStage,

        stage_order: stageOrder,

        last_template_id: input.templateId ?? null,

        last_template_name: templateName,
      });
    } else {
      campaign = await campaignRepository.createCampaign({
        organization_id: input.organizationId,

        user_id: input.userId,

        created_by: input.userId,

        name: input.campaignName,

        campaign_name: input.campaignName,

        subject: input.subject,

        body: input.body,

        template_id: input.templateId ?? null,

        status: "draft",

        recipient_count: recipientCount,

        campaign_stage: campaignStage,

        stage_order: stageOrder,

        last_template_id: input.templateId ?? null,

        last_template_name: templateName,
      });

      campaignId = campaign.id;
    }

    if (!campaignId) {
      throw new Error("Campaign ID is required after save.");
    }

    // ----------------------------------------------------------
    // REPLACE RECIPIENTS
    // ----------------------------------------------------------

    await campaignRepository.replaceRecipients(
      campaignId,
      input.recipients.map((recipient) => ({
        contact_id: recipient.contactId,

        email: recipient.email,

        first_name: recipient.firstName,

        last_name: recipient.lastName,

        status: "pending",
      })),
    );

    // ----------------------------------------------------------
    // RETURN FRESH CAMPAIGN
    // ----------------------------------------------------------

    return await campaignRepository.getCampaign(campaignId);
  }

  // ============================================================
  // GET TEMPLATE NAME
  // ============================================================

  private async getTemplateName(templateId: string) {
    const { createClient } = await import("@/lib/supabase/server");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("email_templates")
      .select("name")
      .eq("id", templateId)
      .maybeSingle();

    if (error) {
      console.error("Unable to load template name:", error);

      return null;
    }

    return data?.name ?? null;
  }
}

export const campaignService = new CampaignService();