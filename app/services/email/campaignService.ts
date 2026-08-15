import { personalizeText } from "@/app/components/email/BulkEmailComposer/personalize";
import { emailService } from "./emailService";
import { campaignRepository } from "@/app/repositories/email/campaignRepository";
import { SaveCampaignDraftInput } from "../../actions/email/saveCampaignDraft";

export class CampaignService {
  // ============================================================
  // SEND CAMPAIGN
  // ============================================================

  async sendCampaign(campaignId: string) {
    // ------------------------------------------------------------
    // 1. Load campaign
    // ------------------------------------------------------------

    const campaign = await campaignRepository.getCampaign(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    if (campaign.status === "sent") {
      throw new Error("This campaign has already been sent.");
    }

    // ------------------------------------------------------------
    // 2. Get authenticated user
    // ------------------------------------------------------------

    const supabase = await (
      await import("@/lib/supabase/server")
    ).createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized.");
    }

    // ------------------------------------------------------------
    // 3. Load recipients BEFORE creating send history
    // ------------------------------------------------------------

    const recipients = await campaignRepository.getRecipients(campaignId);

    const recipientList = recipients ?? [];

    const recipientCount = recipientList.length;

    if (recipientCount === 0) {
      throw new Error("This campaign has no recipients.");
    }

    // ------------------------------------------------------------
    // 4. Create campaign send-history record
    // ------------------------------------------------------------
    console.log("CREATING CAMPAIGN SEND HISTORY:", {
      campaignId,
      organizationId: campaign.organization_id,
      sentBy: user.id,
      recipientCount,
    });

    const campaignSend = await campaignRepository.createCampaignSend({
      campaignId,

      organizationId: campaign.organization_id,

      sentBy: user.id,

      status: "sending",

      recipientCount,

      sentCount: 0,

      failedCount: 0,

      startedAt: new Date().toISOString(),

      completedAt: null,
    });

    // ------------------------------------------------------------
    // 5. Mark campaign as sending
    // ------------------------------------------------------------

    await campaignRepository.updateCampaignStatus(campaignId, "sending");

    // ------------------------------------------------------------
    // 6. Send recipients
    // ------------------------------------------------------------

    let sent = 0;
    let failed = 0;

    for (const recipient of recipientList) {
      console.log("Sending campaign email to:", recipient.email);

      try {
        const result = await emailService.sendEmail({
          to: [recipient.email],

          subject: personalizeText(campaign.subject, recipient),

          html: personalizeText(campaign.body, recipient),

          text: personalizeText(campaign.body, recipient),
        });

        console.log("Email send result:", result);

        // --------------------------------------------------------
        // Successful send
        // --------------------------------------------------------

        if (result.success) {
          sent++;

          await campaignRepository.updateRecipientStatus(recipient.id, "sent");
        }

        // --------------------------------------------------------
        // Failed send
        // --------------------------------------------------------
        else {
          failed++;

          console.error(
            "Email provider failed:",
            recipient.email,
            result.error,
          );

          await campaignRepository.updateRecipientStatus(
            recipient.id,
            "failed",
          );
        }

        // --------------------------------------------------------
        // Update send-history progress
        // --------------------------------------------------------

        await campaignRepository.updateCampaignSend(campaignSend.id, {
          sentCount: sent,
          failedCount: failed,
        });
      } catch (error) {
        failed++;

        console.error("Unexpected send error:", recipient.email, error);

        await campaignRepository.updateRecipientStatus(recipient.id, "failed");

        await campaignRepository.updateCampaignSend(campaignSend.id, {
          sentCount: sent,
          failedCount: failed,
        });
      }
    }

    // ------------------------------------------------------------
    // 7. Determine final status
    // ------------------------------------------------------------

    let finalStatus: "sent" | "partial" | "failed";

    if (sent === recipientCount) {
      finalStatus = "sent";
    } else if (sent > 0) {
      finalStatus = "partial";
    } else {
      finalStatus = "failed";
    }

    // ------------------------------------------------------------
    // 8. Complete send-history record
    // ------------------------------------------------------------

    await campaignRepository.updateCampaignSend(campaignSend.id, {
      status: finalStatus,

      recipientCount,

      sentCount: sent,

      failedCount: failed,

      completedAt: new Date().toISOString(),
    });

    // ------------------------------------------------------------
    // 9. Update campaign
    // ------------------------------------------------------------

    await campaignRepository.updateCampaignStatus(campaignId, finalStatus, {
      sent_at: new Date().toISOString(),
    });

    // ------------------------------------------------------------
    // 10. Return result to UI
    // ------------------------------------------------------------

    return {
      sent,

      failed,

      recipientCount,

      status: finalStatus,

      sendId: campaignSend.id,
    };
  }

  // ============================================================
  // SAVE CAMPAIGN DRAFT
  // ============================================================

  async saveDraft(input: SaveCampaignDraftInput) {
    let campaignId = input.campaignId;

    console.log("Incoming campaignId:", input.campaignId);

    console.log("Resolved campaignId:", campaignId);

    // ------------------------------------------------------------
    // UPDATE EXISTING CAMPAIGN
    // ------------------------------------------------------------

    if (campaignId) {
      await campaignRepository.updateCampaign(campaignId, {
        organization_id: input.organizationId,

        created_by: input.userId,

        user_id: input.userId,

        name: input.campaignName,

        campaign_name: input.campaignName,

        subject: input.subject,

        body: input.body,

        template_id: input.templateId ?? null,

        recipient_count: input.recipients.length,

        status: "draft",
      });
    }

    // ------------------------------------------------------------
    // CREATE NEW CAMPAIGN
    // ------------------------------------------------------------
    else {
      const newCampaign = await campaignRepository.createCampaign({
        organizationId: input.organizationId,

        userId: input.userId,

        campaignName: input.campaignName,

        subject: input.subject,

        body: input.body,

        templateId: input.templateId ?? null,

        status: "draft",

        recipientCount: input.recipients.length,
      });

      campaignId = (
        newCampaign as {
          id?: string;
        }
      )?.id;

      if (!campaignId) {
        throw new Error(
          "Campaign was created but no campaign ID was returned.",
        );
      }
    }

    // ------------------------------------------------------------
    // Replace recipients
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // Return saved campaign
    // ------------------------------------------------------------

    return await campaignRepository.getCampaign(campaignId);
  }
}

export const campaignService = new CampaignService();
