"use server";

import { revalidatePath } from "next/cache";

import { emailService } from "../../services/email/emailService";

export interface SendEmailActionInput {
  to: string[];

  subject: string;

  html: string;

  text?: string;

  cc?: string[];

  bcc?: string[];

  replyTo?: string;
}

export async function sendEmail(
  input: SendEmailActionInput,
) {
  try {
    if (!input.to.length) {
      throw new Error(
        "At least one recipient is required.",
      );
    }

    if (!input.subject.trim()) {
      throw new Error(
        "Subject is required.",
      );
    }

    if (!input.html.trim()) {
      throw new Error(
        "Email body is required.",
      );
    }

    const result =
      await emailService.sendEmail(input);

    revalidatePath("/marketing/bulk-email");
    revalidatePath("/marketing/email-history");

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}