import { createClient } from "@/lib/supabase/server";

export class CampaignRepository {
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

  async createCampaign(campaignData: Record<string, unknown>) {
    const supabase = await createClient();

    // Map incoming payload properties to match your database schema columns exactly
    const dbPayload: Record<string, unknown> = {
      name: campaignData.campaignName || campaignData.name,
      subject: campaignData.subject,
      body: campaignData.body,
      template_id: campaignData.templateId ?? null,
      organization_id: campaignData.organizationId,
      status: campaignData.status || "draft",
    };

    // Include user_id only if your table has the column and the value is present
    if (campaignData.userId) {
      dbPayload.user_id = campaignData.userId;
    }

    const { data, error } = await supabase
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

    // Map incoming payload properties to match your database schema columns exactly
    const dbPayload: Record<string, unknown> = {};

    if (
      campaignData.campaignName !== undefined ||
      campaignData.name !== undefined
    ) {
      dbPayload.name = campaignData.campaignName || campaignData.name;
    }
    if (campaignData.subject !== undefined) {
      dbPayload.subject = campaignData.subject;
    }
    if (campaignData.body !== undefined) {
      dbPayload.body = campaignData.body;
    }
    if (campaignData.templateId !== undefined) {
      dbPayload.template_id = campaignData.templateId;
    }
    if (campaignData.status !== undefined) {
      dbPayload.status = campaignData.status;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Repository user:", user);
    console.log("Campaign payload:", campaignData);

    const { data, error } = await supabase
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
      .update({ status, ...extra })
      .eq("id", campaignId);

    if (error) throw error;
  }

  async getRecipients(campaignId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
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

    // Delete existing recipients for this campaign draft
    const { error: deleteError } = await supabase
      .from("email_campaign_recipients")
      .delete()
      .eq("campaign_id", campaignId);

    if (deleteError) throw deleteError;

    if (recipients.length === 0) return;

    // Insert new recipient list with proper column mapping (e.g., camelCase to snake_case if needed)
    const formattedRecipients = recipients.map((r) => ({
      campaign_id: campaignId,
      contact_id: r.contactId ?? r.contact_id,
      email: r.email,
      first_name: r.firstName ?? r.first_name,
      last_name: r.lastName ?? r.last_name,
      status: r.status ?? "pending",
    }));

    const { error: insertError } = await supabase
      .from("email_campaign_recipients")
      .insert(formattedRecipients);

    if (insertError) throw insertError;
  }

  async updateRecipientStatus(recipientId: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("email_campaign_recipients")
      .update({ status })
      .eq("id", recipientId);

    if (error) throw error;
  }
}

export const campaignRepository = new CampaignRepository();
