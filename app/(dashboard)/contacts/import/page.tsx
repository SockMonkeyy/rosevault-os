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

          <h1 className="text-3xl font-semibold">
            Import Contacts
          </h1>

          <p className="mt-2 max-w-3xl text-gray-400">
            Upload a CSV file, review the automatic field mapping,
            preview your contacts, choose how duplicates should be
            handled, and import them into RoseVault OS.
          </p>
        </div>

        <ContactImporter
          organizationId={membership.organization_id}
          userId={user.id}
        />
      </div>
    </div>
  );
}