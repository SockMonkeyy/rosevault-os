import { ServerClient } from "postmark";

import {
  EmailProvider,
  EmailSendResult,
  SendEmailOptions,
} from "./EmailProvider";

export class PostmarkProvider implements EmailProvider {
  private postmark: ServerClient;

  constructor() {
    const serverToken = process.env.POSTMARK_SERVER_TOKEN;

    if (!serverToken) {
      throw new Error(
        "Missing POSTMARK_SERVER_TOKEN environment variable.",
      );
    }

    this.postmark = new ServerClient(serverToken);
  }

  async send(
    options: SendEmailOptions,
  ): Promise<EmailSendResult> {
    try {
      const from =
        process.env.POSTMARK_FROM_EMAIL ??
        "RoseVault <noreply@rosevault.app>";

      const response = await this.postmark.sendEmail({
        From: from,

        To: options.to.join(","),

        Cc:
          options.cc && options.cc.length > 0
            ? options.cc.join(",")
            : undefined,

        Bcc:
          options.bcc && options.bcc.length > 0
            ? options.bcc.join(",")
            : undefined,

        ReplyTo: options.replyTo,

        Subject: options.subject,

        HtmlBody: options.html,

        TextBody: options.text,

        Attachments: options.attachments?.map((attachment) => ({
          Name: attachment.filename,

          Content:
            attachment.content instanceof Uint8Array
              ? Buffer.from(attachment.content).toString("base64")
              : typeof attachment.content === "string"
                ? Buffer.from(
                    attachment.content,
                    "utf8",
                  ).toString("base64")
                : Buffer.from(
                    attachment.content,
                  ).toString("base64"),

          ContentType:
            attachment.contentType ??
            "application/octet-stream",

          // Postmark Attachment type requires ContentID; use filename as fallback
          ContentID: attachment.filename,
        })),

        MessageStream: "outbound",
      });

      return {
        success: true,
        providerId: response.MessageID,
      };
    } catch (error) {
      console.error(
        "Postmark email provider error:",
        error,
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Postmark email provider error.",
      };
    }
  }
}

export const postmarkProvider =
  new PostmarkProvider();