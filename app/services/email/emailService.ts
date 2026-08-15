import { authService } from "../auth/authService";
import { emailRepository } from "../../repositories/email/emailRepository";
import { resendProvider, SendEmailOptions } from "../../providers/email";

export class EmailService {
  async sendEmail(options: SendEmailOptions) {
    const { user, membership } = await authService.requireMembership();

    console.log("Saving email with user:", user.id);

    // 1. Save email as queued
    const email = await emailRepository.saveEmail({
      organization_id: membership.organization_id,

      contact_id: null,
      transaction_id: null,

      subject: options.subject,

      html_body: options.html,

      text_body: options.text ?? null,

      recipients: options.to,

      cc: options.cc ?? [],

      bcc: options.bcc ?? [],

      provider: "resend",

      provider_message_id: null,

      status: "queued",

      // REQUIRED
      created_by: user.id,

      // Keep for compatibility until we clean up the schema
      user_id: user.id,
    });
    // 2. Send email
    const result = await resendProvider.send(options);

    // 3. Update status
    await emailRepository.updateStatus(
      email.id,
      result.success ? "sent" : "failed",
      result.providerId,
    );

    // 4. Return
    return result;
    console.log("Email log created:", email.id);
  }
}

export const emailService = new EmailService();
