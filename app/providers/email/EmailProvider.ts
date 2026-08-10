export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];

  subject: string;

  html: string;

  text?: string;

  replyTo?: string;

  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface EmailProvider {
  send(
    options: SendEmailOptions,
  ): Promise<EmailSendResult>;
}