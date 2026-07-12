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

    // ... rest of the promise blocks remain the same
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

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm text-[#d4af37] hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold">Contacts</h1>

            <p className="mt-2 text-gray-400">
              Manage your clients, leads, investors, agents, vendors, and
              business relationships.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/contacts/groups-tags"
              className="rounded-lg border border-[#333333] px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Groups & Tags
            </Link>

            <Link
              href="/contacts/import"
              className="rounded-lg border border-[#333333] px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Import Contacts
            </Link>

            <Link
              href="/contacts/new"
              className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
            >
              + Add Contact
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5">
            <p className="text-sm text-gray-400">Total Contacts</p>
            <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
              {contacts?.length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5">
            <p className="text-sm text-gray-400">Buyers</p>
            <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
              {contacts?.filter((contact) => contact.contact_type === "buyer")
                .length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5">
            <p className="text-sm text-gray-400">Sellers</p>
            <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
              {contacts?.filter((contact) => contact.contact_type === "seller")
                .length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5">
            <p className="text-sm text-gray-400">Leads</p>
            <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
              {contacts?.filter((contact) => contact.contact_type === "lead")
                .length ?? 0}
            </p>
          </div>
        </div>

        {/* Contacts Table */}
        {!contacts || contacts.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#151515] p-8">
            <div className="max-w-md text-center">
              <h3 className="text-xl font-semibold">No contacts yet</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add your first contact or import an existing contact list to
                begin building your RoseVault CRM.
              </p>

              <Link
                href="/contacts/new"
                className="mt-6 inline-block rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
              >
                + Add Your First Contact
              </Link>
            </div>
          </div>
        ) : (
          <ContactsTable
            contacts={contacts ?? []}
            groups={groups ?? []}
            tags={tags ?? []}
            groupMemberships={groupMemberships ?? []}
            tagAssignments={tagAssignments ?? []}
            organizationId={membership.organization_id}
          />
        )}
      </div>
    </div>
  );
}
