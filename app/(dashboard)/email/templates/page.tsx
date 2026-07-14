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
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
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
              ←
            </span>

            Back to Contacts
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                RoseVault Communications
              </p>

              <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
                Email Templates
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
                Create reusable email templates for leads, buyers, sellers,
                investors, follow-ups, transactions, and marketing campaigns.
              </p>
            </div>

            <Link
              href="/email/compose"
              className="cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-center text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              Compose Email
            </Link>
          </div>
        </div>

        {/* Templates Manager */}
        <EmailTemplatesManager
          organizationId={membership.organization_id}
          userId={user.id}
          initialTemplates={templates ?? []}
        />
      </div>
    </div>
  );
}