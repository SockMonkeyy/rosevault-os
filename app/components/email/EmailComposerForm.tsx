"use client";

import { useState, useTransition } from "react";

import { sendEmail } from "@/app/actions/email/sendEmail";

export default function EmailComposerForm() {
  const [pending, startTransition] = useTransition();

  const [to, setTo] = useState("");

  const [subject, setSubject] = useState("");

  const [message, setMessage] = useState("");

  const [result, setResult] = useState<
    | {
        success: boolean;
        error?: string;
      }
    | undefined
  >();

  async function handleSubmit() {
    setResult(undefined);

    startTransition(async () => {
      const response = await sendEmail({
        to: to
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean),

        subject,

        html: message,

        text: message,
      });

      setResult(response);

      if (response.success) {
        setTo("");
        setSubject("");
        setMessage("");
      }
    });
  }

  return (
    <div className="space-y-6">

      {result && (
        <div
          className={`rounded-xl p-4 text-sm ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.success
            ? "Email sent successfully."
            : result.error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">
          To
        </label>

        <input
          value={to}
          onChange={(e) =>
            setTo(e.target.value)
          }
          className="w-full rounded-xl border border-[#E3DCD0] p-3"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Subject
        </label>

        <input
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          className="w-full rounded-xl border border-[#E3DCD0] p-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Message
        </label>

        <textarea
          rows={10}
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          className="w-full rounded-xl border border-[#E3DCD0] p-3"
        />
      </div>

      <button
        disabled={pending}
        onClick={handleSubmit}
        className="rounded-xl bg-[#0D0C0A] px-5 py-3 font-medium text-[#D8B66A]"
      >
        {pending
          ? "Sending..."
          : "Send Email"}
      </button>

    </div>
  );
}