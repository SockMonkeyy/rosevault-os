import Link from "next/link";

import EmailComposerForm from "@/app/components/email/EmailComposerForm";

export default function ComposeEmailPage() {
  return (
    <div className="min-h-screen bg-[#FBF7EF] p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/marketing"
          className="mb-6 inline-block text-sm font-medium text-[#B7832F] hover:underline"
        >
          ← Back to Marketing
        </Link>

        <div className="rounded-2xl border border-[#EDE7DC] bg-white shadow-sm">

          <div className="border-b border-[#EDE7DC] p-8">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
              Communication
            </p>

            <h1 className="mt-2 font-serif text-4xl text-[#29231D]">
              Compose Email
            </h1>

            <p className="mt-3 max-w-2xl text-[#7C7265]">
              Send professional emails to clients,
              leads, vendors, or transaction contacts.
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