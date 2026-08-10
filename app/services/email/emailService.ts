import { authService } from "../auth/authService";
import { emailRepository } from "../../repositories/email/emailRepository";
import { resendProvider, SendEmailOptions } from "../../providers/email";

export class EmailService {
  async sendEmail(options: SendEmailOptions) {
    const { user, membership } =
      await authService.requireMembership();

    // 1. Save email as queued
    const email = await emailRepository.saveEmail({
      organization_id: membership.organization_id,

      subject: options.subject,

      html_body: options.html,

      text_body: options.text ?? null,

      recipients: options.to,

      cc: options.cc,

      bcc: options.bcc,

      provider: "resend",

      status: "queued",

      user_id: user.id,
    });

    // 2. Send email
    const result =
      await resendProvider.send(options);

    // 3. Update status
    await emailRepository.updateStatus(
      email.id,
      result.success ? "sent" : "failed",
      result.providerId,
    );

    // 4. Return
    return result;
  }
}

export const emailService =
  new EmailService();