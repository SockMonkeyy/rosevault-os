import { createClient } from "@/lib/supabase/server";

export class CampaignRepository {
  // ============================================================
  // GET CAMPAIGN
  // ============================================================

  async getCampaign(campaignId: string) {
    const supabase = await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ============================================================
  // CREATE CAMPAIGN
  // ============================================================

  async createCampaign(
    campaignData: Record<string, unknown>,
  ) {
    const supabase = await createClient();

    const dbPayload: Record<string, unknown> = {
      organization_id:
        campaignData.organization_id ??
        campaignData.organizationId,

      created_by:
        campaignData.created_by ??
        campaignData.createdBy ??
        campaignData.user_id ??
        campaignData.userId,

      user_id:
        campaignData.user_id ??
        campaignData.userId,

      name:
        campaignData.name ??
        campaignData.campaignName,

      campaign_name:
        campaignData.campaign_name ??
        campaignData.campaignName ??
        campaignData.name,

      subject:
        campaignData.subject,

      body:
        campaignData.body,

      template_id:
        campaignData.template_id ??
        campaignData.templateId ??
        null,

      status:
        campaignData.status ??
        "draft",

      recipient_count:
        campaignData.recipient_count ??
        0,

      campaign_stage:
        campaignData.campaign_stage ??
        campaignData.campaignStage ??
        "Introduction",

      stage_order:
        campaignData.stage_order ??
        campaignData.stageOrder ??
        1,

      last_template_id:
        campaignData.last_template_id ??
        campaignData.lastTemplateId ??
        campaignData.template_id ??
        campaignData.templateId ??
        null,

      last_template_name:
        campaignData.last_template_name ??
        campaignData.lastTemplateName ??
        null,
    };

    const {
      data,
      error,
    } = await supabase
      .from("email_campaigns")
      .insert(dbPayload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ============================================================
  // UPDATE CAMPAIGN
  // ============================================================

  async updateCampaign(
    campaignId: string,
    campaignData: Record<string, unknown>,
  ) {
    const supabase = await createClient();

    const dbPayload: Record<string, unknown> = {};

    // ----------------------------------------------------------
    // BASIC CAMPAIGN INFORMATION
    // ----------------------------------------------------------

    if (
      campaignData.name !== undefined ||
      campaignData.campaignName !== undefined
    ) {
      dbPayload.name =
        campaignData.name ??
        campaignData.campaignName;
    }

    if (
      campaignData.campaign_name !== undefined ||
      campaignData.campaignName !== undefined
    ) {
      dbPayload.campaign_name =
        campaignData.campaign_name ??
        campaignData.campaignName;
    }

    if (
      campaignData.subject !== undefined
    ) {
      dbPayload.subject =
        campaignData.subject;
    }

    if (
      campaignData.body !== undefined
    ) {
      dbPayload.body =
        campaignData.body;
    }

    if (
      campaignData.template_id !== undefined ||
      campaignData.templateId !== undefined
    ) {
      dbPayload.template_id =
        campaignData.template_id ??
        campaignData.templateId ??
        null;
    }

    if (
      campaignData.status !== undefined
    ) {
      dbPayload.status =
        campaignData.status;
    }

    if (
      campaignData.recipient_count !== undefined
    ) {
      dbPayload.recipient_count =
        campaignData.recipient_count;
    }

    // ----------------------------------------------------------
    // CAMPAIGN JOURNEY
    // ----------------------------------------------------------

    if (
      campaignData.campaign_stage !== undefined ||
      campaignData.campaignStage !== undefined
    ) {
      dbPayload.campaign_stage =
        campaignData.campaign_stage ??
        campaignData.campaignStage;
    }

    if (
      campaignData.stage_order !== undefined ||
      campaignData.stageOrder !== undefined
    ) {
      dbPayload.stage_order =
        campaignData.stage_order ??
        campaignData.stageOrder;
    }

    // ----------------------------------------------------------
    // LAST TEMPLATE
    // ----------------------------------------------------------

    if (
      campaignData.last_template_id !== undefined ||
      campaignData.lastTemplateId !== undefined
    ) {
      dbPayload.last_template_id =
        campaignData.last_template_id ??
        campaignData.lastTemplateId ??
        null;
    }

    if (
      campaignData.last_template_name !== undefined ||
      campaignData.lastTemplateName !== undefined
    ) {
      dbPayload.last_template_name =
        campaignData.last_template_name ??
        campaignData.lastTemplateName ??
        null;
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("email_campaigns")
      .update(dbPayload)
      .eq("id", campaignId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ============================================================
  // UPDATE CAMPAIGN STATUS
  // ============================================================

  async updateCampaignStatus(
    campaignId: string,
    status: string,
    extra: Record<string, unknown> = {},
  ) {
    const supabase = await createClient();

    const {
      error,
    } = await supabase
      .from("email_campaigns")
      .update({
        status,
        ...extra,
      })
      .eq("id", campaignId);

    if (error) {
      throw error;
    }
  }

  // ============================================================
  // GET RECIPIENTS
  // ============================================================

  async getRecipients(
    campaignId: string,
  ) {
    const supabase = await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("email_campaign_recipients")
      .select("*")
      .eq(
        "campaign_id",
        campaignId,
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  // ============================================================
  // REPLACE RECIPIENTS
  // ============================================================

  async replaceRecipients(
    campaignId: string,
    recipients: Array<{
      contact_id?: string | null;
      contactId?: string | null;
      email: string;
      first_name?: string | null;
      firstName?: string | null;
      last_name?: string | null;
      lastName?: string | null;
      status?: string;
    }>,
  ) {
    const supabase = await createClient();

    // ----------------------------------------------------------
    // DELETE OLD RECIPIENTS
    // ----------------------------------------------------------

    const {
      error: deleteError,
    } = await supabase
      .from("email_campaign_recipients")
      .delete()
      .eq(
        "campaign_id",
        campaignId,
      );

    if (deleteError) {
      throw deleteError;
    }

    // Nothing else to insert.
    if (recipients.length === 0) {
      return [];
    }

    // ----------------------------------------------------------
    // FORMAT RECIPIENTS
    // ----------------------------------------------------------

    const formattedRecipients =
      recipients.map(
        (recipient) => ({
          campaign_id:
            campaignId,

          contact_id:
            recipient.contact_id ??
            recipient.contactId ??
            null,

          email:
            recipient.email,

          first_name:
            recipient.first_name ??
            recipient.firstName ??
            null,

          last_name:
            recipient.last_name ??
            recipient.lastName ??
            null,

          status:
            recipient.status ??
            "pending",
        }),
      );

    // ----------------------------------------------------------
    // INSERT NEW RECIPIENTS
    // ----------------------------------------------------------

    const {
      data,
      error: insertError,
    } = await supabase
      .from(
        "email_campaign_recipients",
      )
      .insert(
        formattedRecipients,
      )
      .select("*");

    if (insertError) {
      throw insertError;
    }

    return data ?? [];
  }

  // ============================================================
  // UPDATE RECIPIENT STATUS
  // ============================================================

  async updateRecipientStatus(
    recipientId: string,
    status: string,
  ) {
    const supabase = await createClient();

    const {
      error,
    } = await supabase
      .from(
        "email_campaign_recipients",
      )
      .update({
        status,
      })
      .eq(
        "id",
        recipientId,
      );

    if (error) {
      throw error;
    }
  }
}

export const campaignRepository =
  new CampaignRepository();