import Link from "next/link";

import EmailComposerForm from "@/app/components/email/EmailComposerForm";

export default function DeveloperEmailPage() {
  return (
    <div className="min-h-screen bg-[#FBF7EF] p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/settings"
          className="mb-6 inline-block text-sm font-medium text-[#B7832F] hover:underline"
        >
          ← Back to Settings
        </Link>

        <div className="rounded-2xl border border-[#EDE7DC] bg-white shadow-sm">

          <div className="border-b border-[#EDE7DC] p-8">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
              Developer Tools
            </p>

            <h1 className="mt-2 font-serif text-4xl text-[#29231D]">
              Email Testing
            </h1>

            <p className="mt-3 max-w-2xl text-[#7C7265]">
              This page is for internal testing only.
              It bypasses campaigns and allows direct testing
              of the email service and provider.
            </p>

          </div>

          <div className="p-8">
            <EmailComposerForm />
          </div>

        </div>
      </div>
    </div>
  );
}