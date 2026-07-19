import Link from "next/link";
import { redirect } from "next/navigation";

import ContactsTable from "@/app/components/ContactsTable";
import { createClient } from "@/lib/supabase/server";

import WorkspaceLayout from "@/app/components/layout/WorkspaceLayout";

import PageHeader from "@/app/components/ui/PageHeader";
import Button from "@/app/components/ui/Button";
import StatCard from "@/app/components/ui/StatCard";
import SectionCard from "@/app/components/ui/SectionCard";
import EmptyState from "@/app/components/ui/EmptyState";
import DataTable from "@/app/components/ui/DataTable";

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
          primary_phone,
          primary_phone_type,
          secondary_phone,
          secondary_phone_type,
          spouse_primary_phone,
          spouse_primary_phone_type,
          spouse_secondary_phone,
          spouse_secondary_phone_type,
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
        `
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
    <WorkspaceLayout>
      <PageHeader
        eyebrow="Dashboard"
        title="Relationship Registry"
        description="Manage clients, buyers, sellers, lenders, vendors, and business relationships inside your RoseVault workspace."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/contacts/groups-tags">
              <Button variant="secondary">Groups & Tags</Button>
            </Link>

            <Link href="/contacts/import">
              <Button variant="secondary">Bulk Import</Button>
            </Link>

            <Link href="/contacts/new">
              <Button>+ Add Contact</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {contactMetrics.map(([label, value]) => (
          <StatCard
            key={label as string}
            label={label as string}
            value={value as number}
          />
        ))}
      </div>

      {!contacts || contacts.length === 0 ? (
        <EmptyState
          title="No Contacts Yet"
          description="Start building your CRM by adding your first contact or importing a CSV file."
          action={
            <Link href="/contacts/new">
              <Button>+ Add Contact</Button>
            </Link>
          }
        />
      ) : (
        <SectionCard>
          <DataTable>
            <ContactsTable
              contacts={contacts ?? []}
              groups={groups ?? []}
              tags={tags ?? []}
              groupMemberships={groupMemberships ?? []}
              tagAssignments={tagAssignments ?? []}
              organizationId={membership.organization_id}
            />
          </DataTable>
        </SectionCard>
      )}
    </WorkspaceLayout>
  );
}