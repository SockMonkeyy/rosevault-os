import { createClient } from "@/lib/supabase/server";

export interface CampaignSendData {
  campaignId: string;
  organizationId: string;
  sentBy: string;
  status?: "sending" | "sent" | "partial" | "failed";
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  startedAt?: string;
  completedAt?: string | null;
}

export class CampaignRepository {
  // ============================================================
  // CAMPAIGN
  // ============================================================

  async getCampaign(campaignId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) throw error;

    return data;
  }

  async createCampaign(
    campaignData: Record<string, unknown>,
  ) {
    const supabase = await createClient();

    const dbPayload: Record<string, unknown> = {
      organization_id:
        campaignData.organizationId ??
        campaignData.organization_id,

      name:
        campaignData.campaignName ??
        campaignData.campaign_name ??
        campaignData.name,

      subject: campaignData.subject,

      body: campaignData.body,

      template_id:
        campaignData.templateId ??
        campaignData.template_id ??
        null,

      status:
        campaignData.status ??
        "draft",

      recipient_count:
        campaignData.recipientCount ??
        campaignData.recipient_count ??
        0,
    };

    const userId =
      campaignData.userId ??
      campaignData.user_id;

    if (userId) {
      dbPayload.user_id = userId;
      dbPayload.created_by = userId;
    }

    const {
      data,
      error,
    } = await supabase
      .from("email_campaigns")
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async updateCampaign(
    campaignId: string,
    campaignData: Record<string, unknown>,
  ) {
    const supabase = await createClient();

    const dbPayload: Record<string, unknown> = {};

    if (
      campaignData.campaignName !== undefined ||
      campaignData.campaign_name !== undefined ||
      campaignData.name !== undefined
    ) {
      dbPayload.name =
        campaignData.campaignName ??
        campaignData.campaign_name ??
        campaignData.name;
    }

    if (campaignData.subject !== undefined) {
      dbPayload.subject = campaignData.subject;
    }

    if (campaignData.body !== undefined) {
      dbPayload.body = campaignData.body;
    }

    if (
      campaignData.templateId !== undefined ||
      campaignData.template_id !== undefined
    ) {
      dbPayload.template_id =
        campaignData.templateId ??
        campaignData.template_id;
    }

    if (campaignData.status !== undefined) {
      dbPayload.status = campaignData.status;
    }

    if (
      campaignData.recipientCount !== undefined ||
      campaignData.recipient_count !== undefined
    ) {
      dbPayload.recipient_count =
        campaignData.recipientCount ??
        campaignData.recipient_count;
    }

    if (
      campaignData.sentAt !== undefined ||
      campaignData.sent_at !== undefined
    ) {
      dbPayload.sent_at =
        campaignData.sentAt ??
        campaignData.sent_at;
    }

    if (campaignData.scheduledFor !== undefined) {
      dbPayload.scheduled_for =
        campaignData.scheduledFor;
    }

    const {
      data,
      error,
    } = await supabase
      .from("email_campaigns")
      .update(dbPayload)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async updateCampaignStatus(
    campaignId: string,
    status: string,
    extra: Record<string, unknown> = {},
  ) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("email_campaigns")
      .update({
        status,
        ...extra,
      })
      .eq("id", campaignId);

    if (error) throw error;
  }

  // ============================================================
  // CAMPAIGN RECIPIENTS
  // ============================================================

  async getRecipients(campaignId: string) {
    const supabase = await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_recipients")
      .select("*")
      .eq("campaign_id", campaignId);

    if (error) throw error;

    return data;
  }

  async replaceRecipients(
    campaignId: string,
    recipients: Array<Record<string, unknown>>,
  ) {
    const supabase = await createClient();

    const {
      error: deleteError,
    } = await supabase
      .from("email_campaign_recipients")
      .delete()
      .eq("campaign_id", campaignId);

    if (deleteError) throw deleteError;

    if (recipients.length === 0) {
      return;
    }

    const formattedRecipients =
      recipients.map((recipient) => ({
        campaign_id: campaignId,

        contact_id:
          recipient.contactId ??
          recipient.contact_id,

        email: recipient.email,

        first_name:
          recipient.firstName ??
          recipient.first_name ??
          null,

        last_name:
          recipient.lastName ??
          recipient.last_name ??
          null,

        status:
          recipient.status ??
          "pending",
      }));

    const {
      error: insertError,
    } = await supabase
      .from("email_campaign_recipients")
      .insert(formattedRecipients);

    if (insertError) throw insertError;
  }

  async updateRecipientStatus(
    recipientId: string,
    status: string,
  ) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("email_campaign_recipients")
      .update({ status })
      .eq("id", recipientId);

    if (error) throw error;
  }

  // ============================================================
  // CAMPAIGN SEND HISTORY
  // ============================================================

  async createCampaignSend(
    sendData: CampaignSendData,
  ) {
    const supabase = await createClient();

    const dbPayload = {
      campaign_id: sendData.campaignId,

      organization_id:
        sendData.organizationId,

      sent_by:
        sendData.sentBy,

      status:
        sendData.status ??
        "sending",

      recipient_count:
        sendData.recipientCount ??
        0,

      sent_count:
        sendData.sentCount ??
        0,

      failed_count:
        sendData.failedCount ??
        0,

      started_at:
        sendData.startedAt ??
        new Date().toISOString(),

      completed_at:
        sendData.completedAt ??
        null,
    };

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_sends")
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create campaign send history: ${error.message}`,
      );
    }

    return data;
  }

  async updateCampaignSend(
    sendId: string,
    updates: {
      status?: "sending" | "sent" | "partial" | "failed";
      recipientCount?: number;
      sentCount?: number;
      failedCount?: number;
      completedAt?: string | null;
    },
  ) {
    const supabase = await createClient();

    const dbPayload: Record<string, unknown> = {};

    if (updates.status !== undefined) {
      dbPayload.status = updates.status;
    }

    if (updates.recipientCount !== undefined) {
      dbPayload.recipient_count =
        updates.recipientCount;
    }

    if (updates.sentCount !== undefined) {
      dbPayload.sent_count =
        updates.sentCount;
    }

    if (updates.failedCount !== undefined) {
      dbPayload.failed_count =
        updates.failedCount;
    }

    if (updates.completedAt !== undefined) {
      dbPayload.completed_at =
        updates.completedAt;
    }

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_sends")
      .update(dbPayload)
      .eq("id", sendId)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to update campaign send history: ${error.message}`,
      );
    }

    return data;
  }

  async getCampaignSends(
    campaignId: string,
  ) {
    const supabase = await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_sends")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("started_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Failed to load campaign send history: ${error.message}`,
      );
    }

    return data;
  }

  async getLatestCampaignSend(
    campaignId: string,
  ) {
    const supabase = await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_sends")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("started_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load latest campaign send: ${error.message}`,
      );
    }

    return data;
  }
}

export const campaignRepository =
  new CampaignRepository();