import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "RESEND_API_KEY is not configured. Add it to your environment variables."
  );
}

export const resend = new Resend(apiKey);

export type SendEmailParams = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
};

export type SendEmailResult = {
  id: string | null;
  error: unknown | null;
};

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const {
    from,
    to,
    subject,
    html,
    text,
    replyTo,
    cc,
    bcc,
    headers,
    tags,
  } = params;

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
    ...(headers ? { headers } : {}),
    ...(tags ? { tags } : {}),
  });

  if (result.error) {
    return {
      id: null,
      error: result.error,
    };
  }

  return {
    id: result.data?.id ?? null,
    error: null,
  };
}