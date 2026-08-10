import { personalizeText } from "@/app/components/email/BulkEmailComposer/personalize";
import { emailService } from "./emailService";
import { campaignRepository } from "@/app/repositories/email/campaignRepository";
import { SaveCampaignDraftInput } from "../../actions/email/saveCampaignDraft";

export class CampaignService {
  async sendCampaign(campaignId: string) {
    // 1. Load campaign via repository
    const campaign = await campaignRepository.getCampaign(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    if (campaign.status === "sent") {
      throw new Error("This campaign has already been sent.");
    }

    // 2. Mark as sending via repository
    await campaignRepository.updateCampaignStatus(campaignId, "sending", {
      sent_at: new Date().toISOString(),
    });

    // 3. Load recipients via repository
    const recipients = await campaignRepository.getRecipients(campaignId);

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients ?? []) {
      try {
        await emailService.sendEmail({
          to: [recipient.email],
          subject: personalizeText(campaign.subject, recipient),
          html: personalizeText(campaign.body, recipient),
          text: personalizeText(campaign.body, recipient),
        });

        sent++;

        // 4. Update recipient success status via repository
        await campaignRepository.updateRecipientStatus(recipient.id, "sent");
      } catch {
        failed++;

        // 5. Update recipient failure status via repository
        await campaignRepository.updateRecipientStatus(recipient.id, "failed");
      }
    }

    // 6. Update final campaign status via repository
    const finalStatus = failed === 0 ? "sent" : "failed";
    await campaignRepository.updateCampaignStatus(campaignId, finalStatus, {
      sent_at: new Date().toISOString(),
    });

    return {
      sent,
      failed,
    };
  }

  async saveDraft(input: SaveCampaignDraftInput) {
    let campaignId = input.campaignId;

    console.log("Incoming campaignId:", input.campaignId);
    console.log("Resolved campaignId:", campaignId);

    if (campaignId) {
      // Update existing campaign draft
      console.log("Incoming campaignId:", input.campaignId);
      console.log("Resolved campaignId:", campaignId);
      await campaignRepository.updateCampaign(campaignId, {
        organization_id: input.organizationId,
        created_by: input.userId,
        name: input.campaignName,
        campaign_name: input.campaignName,
        user_id: input.userId,
        subject: input.subject,
        body: input.body,
        template_id: input.templateId ?? null,
        recipient_count: input.recipients.length,
        status: "draft",
      });
    } else {
      // Create new campaign draft
      console.log("Incoming campaignId:", input.campaignId);
      console.log("Resolved campaignId:", campaignId);
      const newCampaign = await campaignRepository.createCampaign({
        organization_id: input.organizationId,

        // Use the original schema
        created_by: input.userId,
        name: input.campaignName,

        // Keep the new fields too if you still need them
        campaign_name: input.campaignName,
        user_id: input.userId,

        subject: input.subject,
        body: input.body,
        template_id: input.templateId ?? null,

        status: "draft",

        recipient_count: input.recipients.length,
      });
      // Avoid using `any` — assert a minimal shape for the returned campaign
      // cast via `unknown` in case createCampaign's return type is void
      campaignId = (newCampaign as unknown as { id?: string })?.id;
    }

    // Replace the recipient list in the database
    if (campaignId && input.recipients) {
      await campaignRepository.replaceRecipients(
        campaignId,
        input.recipients.map((r: SaveCampaignDraftInput["recipients"][number]) => ({
          contact_id: r.contactId,
          email: r.email,
          first_name: r.firstName,
          last_name: r.lastName,
          status: "pending",
        })),
      );
    }

    return await campaignRepository.getCampaign(campaignId!);
  }
}

export const campaignService = new CampaignService();