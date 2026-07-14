import Link from "next/link";
import { redirect } from "next/navigation";
import ContactsTable from "@/app/components/ContactsTable";
import { createClient } from "@/lib/supabase/server";

export default async function ContactsPage() {
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

  const [
    { data: contacts, error: contactsError },
    { data: groups },
    { data: tags },
    { data: groupMemberships },
    { data: tagAssignments },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        `
          id,
          first_name,
          last_name,
          email,
          cell_phone,
          cell_phone_type,
          business_phone,
          business_phone_type,
          spouse_cell_phone,
          spouse_cell_phone_type,
          spouse_business_phone,
          spouse_business_phone_type,
          contact_type,
          status,
          lead_source,
          mailing_address_line_1,
          mailing_address_line_2,
          mailing_city,
          mailing_state,
          mailing_postal_code,
          property_address_line_1,
          property_address_line_2,
          property_city,
          property_state,
          property_postal_code,
          created_at
        `,
      )
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false }),

    supabase
      .from("contact_groups")
      .select("id, name")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_tags")
      .select("id, name")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_group_memberships")
      .select("contact_id, group_id")
      .eq("organization_id", membership.organization_id),

    supabase
      .from("contact_tag_assignments")
      .select("contact_id, tag_id")
      .eq("organization_id", membership.organization_id),
  ]);

  if (contactsError) {
    console.error("Error loading contacts:", contactsError);
  }

  const contactMetrics = [
    ["Total Contacts", contacts?.length ?? 0],
    ["Buyers", contacts?.filter((c) => c.contact_type === "buyer").length ?? 0],
    ["Sellers", contacts?.filter((c) => c.contact_type === "seller").length ?? 0],
    ["Leads", contacts?.filter((c) => c.contact_type === "lead").length ?? 0],
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-12 lg:py-16">
      
      {/* Editorial Header Section */}
      <header className="mb-12 flex flex-col justify-between gap-6 border-b border-[#EDE7DC]/60 pb-8 xl:flex-row xl:items-end">
        <div className="space-y-2">
          <Link
            href="/"
            className="group inline-flex cursor-pointer items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F] transition-colors duration-300 hover:text-[#916520]"
          >
            <span className="mr-1 transform transition-transform duration-300 group-hover:-translate-x-1">←</span>{" "}
            Dashboard
          </Link>

          <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
            Relationship Registry
          </h1>

          <p className="max-w-2xl text-xs leading-relaxed text-[#7C7265]">
            Manage clients, secondary buyers, private lenders, asset curators, and real estate brokers safely pinned inside your CRM vault.
          </p>
        </div>

        {/* Action Anchor Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/contacts/groups-tags"
            className="cursor-pointer rounded-md border border-[#EDE7DC] bg-white/50 px-4 py-2.5 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:border-[#C4BCB1] hover:bg-white/90 hover:text-[#29231D]"
          >
            Groups & Tags
          </Link>

          <Link
            href="/contacts/import"
            className="cursor-pointer rounded-md border border-[#EDE7DC] bg-white/50 px-4 py-2.5 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:border-[#C4BCB1] hover:bg-white/90 hover:text-[#29231D]"
          >
            Bulk Import
          </Link>

          <Link
            href="/contacts/new"
            className="cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-2.5 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.98]"
          >
            + Add Contact
          </Link>
        </div>
      </header>

      {/* Roster Overview Metrics */}
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {contactMetrics.map(([label, value]) => (
          <div
            key={label}
            className="group cursor-pointer rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/60 hover:shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D] transition-colors duration-300 group-hover:text-[#8F8578]">
              {label}
            </p>
            <p className="mt-4 font-serif text-3xl font-light text-[#B7832F] transition-transform duration-300 group-hover:scale-[1.01]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Workspace Frame */}
      <div className="w-full">
        {!contacts || contacts.length === 0 ? (
          <div className="flex min-h-80 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] p-8 transition-colors duration-300 hover:border-[#D8B66A]/25 hover:bg-[#12110F]/[0.02]">
            <div className="max-w-md text-center">
              <h3 className="font-serif text-lg text-[#29231D]">
                No entries inside the registry
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
                Create a single dossier entry or inject raw tabular CSV archives to begin cataloging your custom workspace data pipelines.
              </p>

              <Link
                href="/contacts/new"
                className="mt-6 inline-block cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-2.5 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.98]"
              >
                + Initialize First Dossier
              </Link>
            </div>
          </div>
        ) : (
          /* Custom Table Block Shell wrapper */
          <div className="overflow-hidden rounded-xl border border-[#EDE7DC] bg-white/40 p-2 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <ContactsTable
              contacts={contacts ?? []}
              groups={groups ?? []}
              tags={tags ?? []}
              groupMemberships={groupMemberships ?? []}
              tagAssignments={tagAssignments ?? []}
              organizationId={membership.organization_id}
            />
          </div>
        )}
      </div>
    </div>
  );
}