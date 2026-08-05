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

const getContactDisplayName = (contact: {
  display_name?: string | null;
  business_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) => {
  return (
    contact.display_name ||
    contact.business_name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() ||
    "Unnamed Contact"
  );
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    per_page?: string;
    sort?: string;
  }>;
};

export default async function ContactsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(
    1,
    parseInt(resolvedSearchParams.page || "1", 10),
  );
  const perPage = [25, 50, 75, 100].includes(
    parseInt(resolvedSearchParams.per_page || "25", 10),
  )
    ? parseInt(resolvedSearchParams.per_page || "25", 10)
    : 25;

  // Support alphabetical sorting parameters: "asc" (A-Z) or "desc" (Z-A)
  const sortDirection = resolvedSearchParams.sort === "desc" ? "desc" : "asc";

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

  const fromRange = (currentPage - 1) * perPage;
  const toRange = fromRange + perPage - 1;

  const [
    { data: contacts, count: totalContactsCount, error: contactsError },
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
          contact_kind,
          display_name,
          business_name,
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
        { count: "exact" },
      )
      .eq("organization_id", membership.organization_id)
      .order("first_name", { ascending: sortDirection === "asc" })
      .range(fromRange, toRange),

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

  const totalPages = Math.ceil((totalContactsCount ?? 0) / perPage);

  // Ensure contact records normalize display names where relevant across computed stats or lists if needed
  const formattedContacts = contacts?.map((contact) => ({
    ...contact,
    display_name: getContactDisplayName(contact),
  }));

  const contactMetrics = [
    ["Total Contacts", totalContactsCount ?? 0],
    [
      "Buyers",
      formattedContacts?.filter((c) => c.contact_type === "buyer").length ?? 0,
    ],
    [
      "Sellers",
      formattedContacts?.filter((c) => c.contact_type === "seller").length ?? 0,
    ],
    [
      "Leads",
      formattedContacts?.filter((c) => c.contact_type === "lead").length ?? 0,
    ],
  ];

  // Uniform responsive button styles with pointer feedback matching your custom theme
  const buttonStyle =
    "min-w-[120px] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0";

  return (
    <WorkspaceLayout>
      <PageHeader
        title="Relationship Registry"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contacts/groups-tags">
              <Button
                variant="secondary"
                className={`${buttonStyle} border-[#EDE7DC] bg-white text-[#29231D] hover:border-[#D8B66A] hover:bg-[#FBF7EF]`}
              >
                Groups & Tags
              </Button>
            </Link>

            <Link href="/contacts/import">
              <Button
                variant="secondary"
                className={`${buttonStyle} border-[#EDE7DC] bg-white text-[#29231D] hover:border-[#D8B66A] hover:bg-[#FBF7EF]`}
              >
                Bulk Import
              </Button>
            </Link>

            <Link href="/contacts/new">
              <Button
                variant="primary"
                className={`${buttonStyle} bg-[#0D0C0A] text-[#D8B66A] hover:bg-[#29231D]`}
              >
                + Add Contact
              </Button>
            </Link>
          </div>
        }
      />
      <p className="mt-3 text-sm text-[#8F8578] max-w-2xl">
        Manage clients, buyers, sellers, lenders, vendors, and business
        relationships inside your workspace.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {contactMetrics.map(([title, value]) => (
          <StatCard
            key={title as string}
            title={title as string}
            value={value as number}
          />
        ))}
      </div>

      {!formattedContacts || formattedContacts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No Contacts Yet"
            description="Start building your CRM by adding your first contact or importing a CSV file."
          />
          <div className="mt-6">
            <Link href="/contacts/new">
              <Button
                variant="primary"
                className="min-w-[140px] cursor-pointer bg-[#0D0C0A] text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#29231D] hover:shadow-sm active:translate-y-0"
              >
                + Add Contact
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {/* Controls Bar: Per Page & Alphabetical Sort Order */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#EDE7DC] bg-white/40 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#7C7265]">Sort:</span>
              <div className="flex items-center gap-1.5">
                {(["asc", "desc"] as const).map((dir) => {
                  const isActive = sortDirection === dir;
                  const queryParams = new URLSearchParams();
                  queryParams.set("per_page", perPage.toString());
                  queryParams.set("page", "1");
                  if (dir !== "asc") queryParams.set("sort", dir);

                  return (
                    <Link
                      key={dir}
                      href={`/contacts?${queryParams.toString()}`}
                      className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                        isActive
                          ? "bg-[#0D0C0A] text-[#D8B66A] shadow-sm"
                          : "border border-[#EDE7DC] bg-white text-[#7C7265] hover:border-[#D8B66A] hover:bg-[#FBF7EF] hover:text-[#29231D]"
                      }`}
                    >
                      {dir === "asc" ? "A–Z" : "Z–A"}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <SectionCard>
            <DataTable>
              <ContactsTable
                initialContacts={formattedContacts ?? []}
                groups={groups ?? []}
                tags={tags ?? []}
                groupMemberships={groupMemberships ?? []}
                tagAssignments={tagAssignments ?? []}
                organizationId={membership.organization_id}
              />
            </DataTable>
          </SectionCard>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#EDE7DC] bg-white/40 px-6 py-4 backdrop-blur-sm sm:flex-row">
              <p className="text-xs text-[#7C7265]">
                Showing{" "}
                <span className="font-medium text-[#29231D]">
                  {fromRange + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[#29231D]">
                  {Math.min(fromRange + perPage, totalContactsCount ?? 0)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#29231D]">
                  {totalContactsCount}
                </span>{" "}
                contacts
              </p>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/contacts?${new URLSearchParams({
                      page: (currentPage - 1).toString(),
                      per_page: perPage.toString(),
                      ...(sortDirection !== "asc"
                        ? { sort: sortDirection }
                        : {}),
                    }).toString()}`}
                    className="cursor-pointer rounded-md border border-[#EDE7DC] bg-white px-4 py-2 text-xs font-medium text-[#29231D] transition-all duration-200 hover:border-[#D8B66A] hover:bg-[#FBF7EF]"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border border-[#EDE7DC] bg-white/50 px-4 py-2 text-xs font-medium text-[#A89C8D] opacity-60">
                    Previous
                  </span>
                )}

                <span className="px-3 text-xs font-medium text-[#7C7265]">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/contacts?${new URLSearchParams({
                      page: (currentPage + 1).toString(),
                      per_page: perPage.toString(),
                      ...(sortDirection !== "asc"
                        ? { sort: sortDirection }
                        : {}),
                    }).toString()}`}
                    className="cursor-pointer rounded-md border border-[#EDE7DC] bg-white px-4 py-2 text-xs font-medium text-[#29231D] transition-all duration-200 hover:border-[#D8B66A] hover:bg-[#FBF7EF]"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border border-[#EDE7DC] bg-white/50 px-4 py-2 text-xs font-medium text-[#A89C8D] opacity-60">
                    Next
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </WorkspaceLayout>
  );
}
