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
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/contacts"
            className="mb-4 inline-block text-sm text-[#d4af37] hover:underline"
          >
            ← Back to Contacts
          </Link>

          <h1 className="text-3xl font-semibold">Import Contacts</h1>

          <p className="mt-2 max-w-3xl text-gray-400">
            Upload a CSV file, review the automatic field mapping, preview your
            contacts, choose how duplicates should be handled, and import them
            into RoseVault OS.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#EDE7DC] bg-white/40 p-5 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Import Template
            </p>

            <h2 className="mt-1 font-serif text-xl text-[#29231D]">
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
            className="rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm"
          >
            ⬇ Download CSV Template
          </a>
        </div>
        <div className="mb-6 rounded-xl border border-[#EDE7DC] bg-[#FBF7EF] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Before You Import
          </p>

          <ul className="mt-3 space-y-2 text-sm text-[#29231D]">
            <li>✓ Download and use the official RoseVault CSV Template.</li>
            <li>✓ Do not rename the column headers.</li>
            <li>✓ Leave fields blank if you don't have the information.</li>
            <li>
              ✓ Phone Types should be: <strong>mobile</strong>,{" "}
              <strong>home</strong>, <strong>work</strong>, or{" "}
              <strong>other</strong>.
            </li>
            <li>
              ✓ Existing contacts are automatically checked to help prevent
              duplicates.
            </li>
          </ul>
        </div>
        <ContactImporter
          organizationId={membership.organization_id}
          userId={user.id}
        />
      </div>
    </div>
  );
}
