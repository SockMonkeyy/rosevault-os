import { Resend } from "resend";

import {
  EmailProvider,
  EmailSendResult,
  SendEmailOptions,
} from "./EmailProvider";

export class ResendProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Missing RESEND_API_KEY environment variable.",
      );
    }

    this.resend = new Resend(apiKey);
  }

  async send(
    options: SendEmailOptions,
  ): Promise<EmailSendResult> {
    try {
      const response = await this.resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ??
          "RoseVault <noreply@rosevault.app>",

        to: options.to,

        cc: options.cc,

        bcc: options.bcc,

        replyTo: options.replyTo,

        subject: options.subject,

        html: options.html,

        text: options.text,

        attachments: options.attachments?.map((att) => ({
          ...att,
          content: att.content instanceof Uint8Array ? Buffer.from(att.content) : att.content,
        })),
      });

      return {
        success: true,
        providerId: response.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown email provider error.",
      };
    }
  }
}

export const resendProvider =
  new ResendProvider();