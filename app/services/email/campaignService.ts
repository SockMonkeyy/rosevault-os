import { personalizeText } from "@/app/components/email/BulkEmailComposer/personalize";
import { emailService } from "./emailService";
import {
  campaignRepository,
} from "@/app/repositories/email/campaignRepository";
import { SaveCampaignDraftInput } from "../../actions/email/saveCampaignDraft";
import { createClient } from "@/lib/supabase/server";

export class CampaignService {
  async sendCampaign(campaignId: string) {
    const supabase = await createClient();

    // ============================================================
    // 1. AUTHENTICATED USER
    // ============================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized.");
    }

    // ============================================================
    // 2. LOAD CAMPAIGN
    // ============================================================

    const campaign =
      await campaignRepository.getCampaign(
        campaignId,
      );

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    // ============================================================
    // 3. LOAD RECIPIENTS
    // ============================================================

    const recipients =
      await campaignRepository.getRecipients(
        campaignId,
      );

    if (
      !recipients ||
      recipients.length === 0
    ) {
      throw new Error(
        "This campaign has no recipients.",
      );
    }

    // ============================================================
    // 4. DETERMINE CAMPAIGN STAGE
    //
    // Existing campaigns may not have a stage yet.
    // We default them to Introduction.
    // ============================================================

    const campaignStage =
      campaign.campaign_stage ||
      "Introduction";

    const stageOrder =
      campaign.stage_order ?? 1;

    // ============================================================
    // 5. LOOK UP THE TEMPLATE NAME
    //
    // We intentionally look this up on the server rather than
    // trusting the browser to provide the template name.
    // ============================================================

    let templateName:
      | string
      | null = null;

    if (campaign.template_id) {
      const {
        data: template,
        error: templateError,
      } = await supabase
        .from("email_templates")
        .select("id, name")
        .eq(
          "id",
          campaign.template_id,
        )
        .eq(
          "organization_id",
          campaign.organization_id,
        )
        .maybeSingle();

      if (templateError) {
        console.error(
          "Error loading campaign template:",
          templateError,
        );
      }

      templateName =
        template?.name ??
        null;
    }

    // ============================================================
    // 6. CREATE SEND HISTORY RECORD
    //
    // This creates a NEW SEND RECORD.
    //
    // It does NOT create a new campaign.
    // ============================================================

    const recipientCount =
      recipients.length;

    const startedAt =
      new Date().toISOString();

    const {
      data: sendRecord,
      error: sendRecordError,
    } = await supabase
      .from("email_campaign_sends")
      .insert({
        campaign_id:
          campaignId,

        organization_id:
          campaign.organization_id,

        sent_by:
          user.id,

        status:
          "sending",

        recipient_count:
          recipientCount,

        sent_count:
          0,

        failed_count:
          0,

        started_at:
          startedAt,

        // Campaign stage snapshot
        stage:
          campaignStage,

        stage_order:
          stageOrder,

        // Template snapshot
        template_id:
          campaign.template_id ??
          null,

        template_name:
          templateName ??
          "Custom Message",
      })
      .select()
      .single();

    if (sendRecordError) {
      console.error(
        "Unable to create campaign send history:",
        sendRecordError,
      );

      throw new Error(
        sendRecordError.message,
      );
    }

    // ============================================================
    // 7. MARK CAMPAIGN AS SENDING
    // ============================================================

    await campaignRepository.updateCampaignStatus(
      campaignId,
      "sending",
      {
        sent_at:
          startedAt,
      },
    );

    // ============================================================
    // 8. SEND EMAILS
    // ============================================================

    let sent = 0;
    let failed = 0;

    for (
      const recipient of recipients
    ) {
      try {
        if (!recipient.email) {
          throw new Error(
            "Recipient does not have an email address.",
          );
        }

        await emailService.sendEmail({
          to: [
            recipient.email,
          ],

          subject:
            personalizeText(
              campaign.subject,
              recipient,
            ),

          html:
            personalizeText(
              campaign.body,
              recipient,
            ),

          text:
            personalizeText(
              campaign.body,
              recipient,
            ),
        });

        sent++;

        await campaignRepository.updateRecipientStatus(
          recipient.id,
          "sent",
        );
      } catch (error) {
        failed++;

        console.error(
          "Unexpected send error:",
          recipient.email,
          error,
        );

        await campaignRepository.updateRecipientStatus(
          recipient.id,
          "failed",
        );
      }
    }

    // ============================================================
    // 9. DETERMINE FINAL STATUS
    // ============================================================

    let finalStatus:
      | "sent"
      | "partial"
      | "failed";

    if (failed === 0) {
      finalStatus =
        "sent";
    } else if (sent > 0) {
      finalStatus =
        "partial";
    } else {
      finalStatus =
        "failed";
    }

    const completedAt =
      new Date().toISOString();

    // ============================================================
    // 10. UPDATE SEND HISTORY
    // ============================================================

    const {
      error:
        historyUpdateError,
    } = await supabase
      .from(
        "email_campaign_sends",
      )
      .update({
        status:
          finalStatus,

        sent_count:
          sent,

        failed_count:
          failed,

        completed_at:
          completedAt,
      })
      .eq(
        "id",
        sendRecord.id,
      );

    if (historyUpdateError) {
      console.error(
        "Unable to update campaign send history:",
        historyUpdateError,
      );

      throw new Error(
        historyUpdateError.message,
      );
    }

    // ============================================================
    // 11. UPDATE CAMPAIGN'S CURRENT TRACKING INFORMATION
    //
    // These fields represent the MOST RECENT send.
    // ============================================================

    await campaignRepository.updateCampaignStatus(
      campaignId,
      finalStatus,
      {
        sent_at:
          completedAt,

        recipient_count:
          recipientCount,

        last_template_id:
          campaign.template_id ??
          null,

        last_template_name:
          templateName ??
          "Custom Message",

        campaign_stage:
          campaignStage,

        stage_order:
          stageOrder,
      },
    );

    // ============================================================
    // 12. RETURN SEND RESULTS
    // ============================================================

    return {
      sent,

      failed,

      campaignId,

      sendId:
        sendRecord.id,

      status:
        finalStatus,

      stage:
        campaignStage,

      stageOrder,

      templateId:
        campaign.template_id ??
        null,

      templateName:
        templateName ??
        "Custom Message",
    };
  }

  // ============================================================
  // SAVE DRAFT
  // ============================================================

  async saveDraft(
    input: SaveCampaignDraftInput,
  ) {
    let campaignId =
      input.campaignId;

    if (campaignId) {
      // ========================================================
      // UPDATE EXISTING CAMPAIGN
      // ========================================================

      await campaignRepository.updateCampaign(
        campaignId,
        {
          organization_id:
            input.organizationId,

          created_by:
            input.userId,

          name:
            input.campaignName,

          campaign_name:
            input.campaignName,

          user_id:
            input.userId,

          subject:
            input.subject,

          body:
            input.body,

          template_id:
            input.templateId ??
            null,

          recipient_count:
            input.recipients.length,

          status:
            "draft",
        },
      );
    } else {
      // ========================================================
      // CREATE NEW CAMPAIGN
      // ========================================================

      const newCampaign =
        await campaignRepository.createCampaign(
          {
            organization_id:
              input.organizationId,

            created_by:
              input.userId,

            name:
              input.campaignName,

            campaign_name:
              input.campaignName,

            user_id:
              input.userId,

            subject:
              input.subject,

            body:
              input.body,

            template_id:
              input.templateId ??
              null,

            status:
              "draft",

            recipient_count:
              input.recipients.length,
          },
        );

      campaignId =
        (
          newCampaign as {
            id?: string;
          }
        )?.id;
    }

    // ============================================================
    // VERIFY CAMPAIGN ID
    // ============================================================

    if (!campaignId) {
      throw new Error(
        "Campaign ID could not be resolved.",
      );
    }

    // ============================================================
    // REPLACE RECIPIENTS
    // ============================================================

    if (
      input.recipients
    ) {
      await campaignRepository.replaceRecipients(
        campaignId,

        input.recipients.map(
          (
            recipient,
          ) => ({
            contact_id:
              recipient.contactId,

            email:
              recipient.email,

            first_name:
              recipient.firstName,

            last_name:
              recipient.lastName,

            status:
              "pending",
          }),
        ),
      );
    }

    return await campaignRepository.getCampaign(
      campaignId,
    );
  }
}

export const campaignService =
  new CampaignService();