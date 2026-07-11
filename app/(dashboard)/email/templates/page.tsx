import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmailTemplatesManager from "@/app/components/EmailTemplatesManager";

export default async function EmailTemplatesPage() {
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

  const { data: templates, error } = await supabase
    .from("email_templates")
    .select(`
      id,
      name,
      subject,
      body,
      category,
      is_active,
      created_at,
      updated_at
    `)
    .eq("organization_id", membership.organization_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading email templates:", error);
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/contacts"
              className="mb-4 inline-block text-sm text-[#d4af37] hover:underline"
            >
              ← Back to Contacts
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-white">
              Email Templates
            </h1>

            <p className="mt-2 max-w-3xl text-gray-400">
              Create reusable email templates for leads, buyers,
              sellers, investors, follow-ups, transactions, and
              marketing campaigns.
            </p>
          </div>

          <Link
            href="/email/compose"
            className="rounded-lg bg-[#d4af37] px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            Compose Email
          </Link>
        </div>

        <EmailTemplatesManager
          organizationId={membership.organization_id}
          userId={user.id}
          initialTemplates={templates ?? []}
        />
      </div>
    </div>
  );
}