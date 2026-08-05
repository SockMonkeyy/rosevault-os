import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactImporter from "@/app/components/ContactImporter";

export default async function ImportContactsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/contacts"
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              &larr;
            </span>
            Back to Contacts
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Data Management
            </p>
            <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              Import Contacts
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
              Upload a CSV file, review the automatic field mapping, preview your
              contacts, choose how duplicates should be handled, and import them
              into RoseVault OS.
            </p>
          </div>
        </div>

        {/* Download Template Section */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Import Template
            </p>

            <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              Download the RoseVault CSV Template
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#7C7265]">
              Start with the official RoseVault import template to ensure your
              contacts, mailing addresses, and property information import
              correctly.
            </p>
          </div>

          <a
            href="/templates/RoseVault_Contact_Import_Template.csv"
            download
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#0D0C0A] px-6 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
          >
            ⬇ Download CSV Template
          </a>
        </div>

        {/* Before You Import Notice */}
        <div className="mb-8 rounded-xl border border-[#EDE7DC] bg-[#FBF7EF]/80 p-6 backdrop-blur-sm lg:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Before You Import
          </p>

          <h3 className="mt-2 font-serif text-lg font-normal tracking-wide text-[#29231D]">
            Guidelines & Best Practices
          </h3>

          <ul className="mt-4 grid grid-cols-1 gap-3 text-xs leading-relaxed text-[#7C7265] sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="text-[#B7832F]">✓</span>
              <span>Download and use the official RoseVault CSV Template.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#B7832F]">✓</span>
              <span>Do not rename the column headers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#B7832F]">✓</span>
              <span>Leave fields blank if you don&apos;t have the information.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#B7832F]">✓</span>
              <span>
                Phone Types should be:{" "}
                <strong className="text-[#29231D]">mobile</strong>,{" "}
                <strong className="text-[#29231D]">home</strong>,{" "}
                <strong className="text-[#29231D]">work</strong>, or{" "}
                <strong className="text-[#29231D]">other</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <span className="text-[#B7832F]">✓</span>
              <span>
                Existing contacts are automatically checked to help prevent
                duplicates.
              </span>
            </li>
          </ul>
        </div>

        {/* Importer Component Container */}
        <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm lg:p-8">
          <ContactImporter
            organizationId={membership.organization_id}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  );
}