import { createClient } from "@/lib/supabase/server";

export interface SaveEmailParams {
  organization_id: string;
  contact_id?: string | null;
  transaction_id?: string | null;

  subject: string;

  html_body: string;

  text_body?: string | null;

  recipients: string[];

  cc?: string[];

  bcc?: string[];

  provider: string;

  provider_message_id?: string | null;

  status: "draft" | "queued" | "sent" | "failed";

  user_id: string;
}

export class EmailRepository {
  async saveEmail(params: SaveEmailParams) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("emails")
      .insert(params)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateStatus(
    emailId: string,
    status: "queued" | "sent" | "failed",
    providerMessageId?: string,
  ) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("emails")
      .update({
        status,
        provider_message_id:
          providerMessageId ?? null,
      })
      .eq("id", emailId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getEmailHistory(
    organizationId: string,
  ) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const emailRepository =
  new EmailRepository();