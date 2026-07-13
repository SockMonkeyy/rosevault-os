import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactGroupsTags from "@/app/components/ContactGroupsTags";

type ContactPropertyRelationship = {
  property_id: string;
  relationship_type: string | null;
  is_primary: boolean | null;
};

type PropertyRecord = {
  id: string;
  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
  property_type: string | null;
  property_status: string | null;
  estimated_value: number | string | null;
};

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (error || !contact) {
    notFound();
  }

  const [
    { data: groups },
    { data: tags },
    { data: groupMemberships },
    { data: tagAssignments },
    { data: propertyRelationshipsData, error: propertyRelationshipsError },
  ] = await Promise.all([
    supabase
      .from("contact_groups")
      .select("id, name, description")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_tags")
      .select("id, name")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_group_memberships")
      .select("group_id")
      .eq("organization_id", membership.organization_id)
      .eq("contact_id", contact.id),

    supabase
      .from("contact_tag_assignments")
      .select("tag_id")
      .eq("organization_id", membership.organization_id)
      .eq("contact_id", contact.id),

    supabase
      .from("contact_property_relationships")
      .select(`
        property_id,
        relationship_type,
        is_primary
      `)
      .eq("organization_id", membership.organization_id)
      .eq("contact_id", contact.id),
  ]);

  if (propertyRelationshipsError) {
    console.error(
      "Error loading contact property relationships:",
      propertyRelationshipsError,
    );
  }

  const assignedGroupIds =
    groupMemberships?.map((membership) => membership.group_id) ?? [];

  const assignedTagIds =
    tagAssignments?.map((assignment) => assignment.tag_id) ?? [];

  const propertyRelationships = (propertyRelationshipsData ??
    []) as ContactPropertyRelationship[];

  const linkedPropertyIds = propertyRelationships.map(
    (relationship) => relationship.property_id,
  );

  let linkedProperties: PropertyRecord[] = [];

  if (linkedPropertyIds.length > 0) {
    const { data: linkedPropertiesData, error: linkedPropertiesError } =
      await supabase
        .from("properties")
        .select(`
          id,
          property_address_line_1,
          property_address_line_2,
          property_city,
          property_state,
          property_postal_code,
          property_type,
          property_status,
          estimated_value
        `)
        .eq("organization_id", membership.organization_id)
        .in("id", linkedPropertyIds);

    if (linkedPropertiesError) {
      console.error(
        "Error loading properties linked to contact:",
        linkedPropertiesError,
      );
    } else {
      linkedProperties = (linkedPropertiesData ?? []) as PropertyRecord[];
    }
  }

  const linkedPropertyRows = propertyRelationships
    .map((relationship) => {
      const property = linkedProperties.find(
        (item) => item.id === relationship.property_id,
      );

      if (!property) {
        return null;
      }

      return {
        ...property,
        relationship_type: relationship.relationship_type,
        is_primary: relationship.is_primary,
      };
    })
    .filter(
      (
        property,
      ): property is PropertyRecord & {
        relationship_type: string | null;
        is_primary: boolean | null;
      } => property !== null,
    );

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const spouseName = [contact.spouse_first_name, contact.spouse_last_name]
    .filter(Boolean)
    .join(" ");

  const hasSpouseInfo = Boolean(
    contact.spouse_first_name ||
      contact.spouse_last_name ||
      contact.spouse_email ||
      contact.spouse_primary_phone ||
      contact.spouse_secondary_phone,
  );

  const mailingAddress = formatAddress(
    contact.mailing_address_line_1,
    contact.mailing_address_line_2,
    contact.mailing_city,
    contact.mailing_state,
    contact.mailing_postal_code,
  );

  const hasPropertyAddress = Boolean(
    contact.property_address_line_1 ||
      contact.property_address_line_2 ||
      contact.property_city ||
      contact.property_state ||
      contact.property_postal_code,
  );

  const propertyAddress = formatAddress(
    contact.property_address_line_1,
    contact.property_address_line_2,
    contact.property_city,
    contact.property_state,
    contact.property_postal_code,
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Back navigation */}
        <Link
          href="/contacts"
          className="mb-5 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
        >
          ← Back to Contacts
        </Link>

        {/* Profile header */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">{fullName}</h1>

              {contact.contact_type && (
                <span className="rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-xs font-medium capitalize text-[#d4af37]">
                  {formatLabel(contact.contact_type)}
                </span>
              )}

              {contact.status && <StatusBadge status={contact.status} />}
            </div>

            <p className="text-gray-400">
              {contact.company || "Individual Contact"}
              {contact.job_title ? ` · ${contact.job_title}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {contact.email && (
              <Link
                href={`/email/compose?contacts=${contact.id}`}
                className="rounded-lg border border-[#d4af37]/50 px-5 py-3 text-sm font-medium text-[#d4af37] transition hover:border-[#d4af37] hover:bg-[#d4af37]/10"
              >
                Send Email
              </Link>
            )}

            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
            >
              Edit Contact
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 xl:col-span-2">
            {/* Contact Information */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Primary contact details and communication preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ContactLinkItem
                  label="Email"
                  value={contact.email}
                  href={contact.email ? `mailto:${contact.email}` : undefined}
                />

                <PhoneItem
                  label="Primary Phone"
                  value={contact.primary_phone}
                  type={contact.primary_phone_type}
                />

                <PhoneItem
                  label="Secondary Phone"
                  value={contact.secondary_phone}
                  type={contact.secondary_phone_type}
                />

                <InfoItem
                  label="Preferred Contact Method"
                  value={contact.preferred_contact_method}
                />
              </div>
            </section>

            {/* Linked Properties */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Linked Properties
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Properties associated with this contact through RoseVault
                    relationship records.
                  </p>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#d4af37]/10 px-3 text-sm font-semibold text-[#d4af37]">
                  {linkedPropertyRows.length}
                </span>
              </div>

              {linkedPropertyRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#333333] bg-[#111111] px-5 py-10 text-center">
                  <p className="text-sm text-gray-500">
                    No properties are currently linked to this contact.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Link this contact from a Property Profile to create a
                    property relationship.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedPropertyRows.map((property) => {
                    const address =
                      property.property_address_line_1 || "Unnamed Property";

                    const location = formatPropertyLocation(
                      property.property_city,
                      property.property_state,
                      property.property_postal_code,
                    );

                    return (
                      <Link
                        key={property.id}
                        href={`/properties/${property.id}`}
                        className="group block rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition hover:border-[#d4af37]/50 hover:bg-[#131313]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-white transition group-hover:text-[#d4af37]">
                                {address}
                              </h3>

                              {property.is_primary && (
                                <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#d4af37]">
                                  Primary
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              {location}
                            </p>

                            {property.estimated_value !== null &&
                              property.estimated_value !== undefined && (
                                <p className="mt-2 text-sm font-medium text-gray-300">
                                  Estimated Value:{" "}
                                  <span className="text-[#d4af37]">
                                    {formatCurrency(property.estimated_value)}
                                  </span>
                                </p>
                              )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {property.relationship_type && (
                              <span className="rounded-full border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-300">
                                {formatLabel(property.relationship_type)}
                              </span>
                            )}

                            {property.property_status && (
                              <span className="rounded-full border border-[#333333] px-3 py-1.5 text-xs text-gray-500">
                                {formatLabel(property.property_status)}
                              </span>
                            )}

                            {property.property_type && (
                              <span className="rounded-full border border-[#333333] px-3 py-1.5 text-xs text-gray-500">
                                {formatLabel(property.property_type)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Related Records */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Related Records
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Transactions, tasks, documents, and other records connected
                  to this contact.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <RelatedRecordCard
                  title="Transactions"
                  description="Purchase, sale, wholesale, and other transaction records."
                  count={0}
                  status="Coming soon"
                />

                <RelatedRecordCard
                  title="Tasks"
                  description="Follow-ups and action items connected to this contact."
                  count={0}
                  status="Coming soon"
                />

                <RelatedRecordCard
                  title="Documents"
                  description="Contracts, disclosures, correspondence, and other files."
                  count={0}
                  status="Coming soon"
                />
              </div>
            </section>

            {/* Spouse Information */}
            {hasSpouseInfo && (
              <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Spouse Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Contact information for the spouse or partner associated
                    with this record.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InfoItem label="Name" value={spouseName || null} />

                  <ContactLinkItem
                    label="Email"
                    value={contact.spouse_email}
                    href={
                      contact.spouse_email
                        ? `mailto:${contact.spouse_email}`
                        : undefined
                    }
                  />

                  <PhoneItem
                    label="Primary Phone"
                    value={contact.spouse_primary_phone}
                    type={contact.spouse_primary_phone_type}
                  />

                  <PhoneItem
                    label="Secondary Phone"
                    value={contact.spouse_secondary_phone}
                    type={contact.spouse_secondary_phone_type}
                  />
                </div>
              </section>
            )}

            {/* Mailing Address */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Mailing Address
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Used for correspondence, mailing labels, and client records.
                </p>
              </div>

              <AddressDisplay address={mailingAddress} />
            </section>

            {/* Property Address */}
            {hasPropertyAddress && (
              <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Property Address
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    The property address stored directly on this contact record.
                  </p>
                </div>

                <AddressDisplay address={propertyAddress} />
              </section>
            )}

            {/* Notes */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">Notes</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Relationship details, context, and important information.
                </p>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-400">
                {contact.notes || "No notes have been added yet."}
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CRM Details */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">CRM Details</h2>

              <div className="mt-6 space-y-5">
                <InfoItem label="Contact Type" value={contact.contact_type} />

                <InfoItem label="Status" value={contact.status} />

                <InfoItem label="Lead Source" value={contact.lead_source} />

                <InfoItem label="Company" value={contact.company} />

                <InfoItem label="Job Title" value={contact.job_title} />

                <InfoItem
                  label="Preferred Contact Method"
                  value={contact.preferred_contact_method}
                />
              </div>
            </section>

            {/* Groups & Tags */}
            <ContactGroupsTags
              contactId={contact.id}
              organizationId={membership.organization_id}
              groups={groups ?? []}
              tags={tags ?? []}
              assignedGroupIds={assignedGroupIds}
              assignedTagIds={assignedTagIds}
            />

            {/* Quick Actions */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Quick Actions
              </h2>

              <div className="mt-5 space-y-3">
                {contact.email ? (
                  <Link
                    href={`/email/compose?contacts=${contact.id}`}
                    className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                  >
                    Send Email
                  </Link>
                ) : (
                  <div className="rounded-lg border border-[#2a2a2a] px-4 py-3 text-center text-sm text-gray-600">
                    No email address available
                  </div>
                )}

                <Link
                  href={`/contacts/${contact.id}/edit`}
                  className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Edit Contact
                </Link>

                {linkedPropertyRows.length > 0 && (
                  <Link
                    href={`/properties/${linkedPropertyRows[0].id}`}
                    className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                  >
                    View Linked Property
                  </Link>
                )}
              </div>
            </section>

            {/* Rosie AI */}
            <section className="rounded-2xl border border-[#d4af37]/30 bg-[#151515] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                Rosie AI
              </p>

              <h2 className="mt-3 text-xl font-semibold text-white">
                Contact Intelligence
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Rosie will eventually summarize conversations, identify
                follow-up opportunities, and recommend the next best action for
                this relationship.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>

      <p className="mt-2 text-gray-200">{value ? formatLabel(value) : "—"}</p>
    </div>
  );
}

function RelatedRecordCard({
  title,
  description,
  count,
  status,
}: {
  title: string;
  description: string;
  count: number;
  status?: string;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">{title}</h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        </div>

        <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#d4af37]/10 px-2 text-sm font-semibold text-[#d4af37]">
          {count}
        </span>
      </div>

      {status && (
        <div className="mt-4 border-t border-[#222222] pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-600">
            {status}
          </span>
        </div>
      )}
    </div>
  );
}

function ContactLinkItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>

      {value && href ? (
        <a
          href={href}
          className="mt-2 inline-block break-all text-gray-200 transition hover:text-[#d4af37] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-2 text-gray-200">—</p>
      )}
    </div>
  );
}

function PhoneItem({
  label,
  value,
  type,
}: {
  label: string;
  value: string | null | undefined;
  type: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>

      {value ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={`tel:${value}`}
            className="text-gray-200 transition hover:text-[#d4af37] hover:underline"
          >
            {value}
          </a>

          {type && (
            <span className="rounded bg-[#222222] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {formatPhoneType(type)}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-2 text-gray-200">—</p>
      )}
    </div>
  );
}

function AddressDisplay({ address }: { address: string }) {
  return (
    <p className="whitespace-pre-line text-sm leading-7 text-gray-200">
      {address || "—"}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "border-green-900/50 bg-green-950/30 text-green-300",
    inactive: "border-gray-700 bg-gray-900/50 text-gray-400",
    lead: "border-blue-900/50 bg-blue-950/30 text-blue-300",
    prospect: "border-amber-900/50 bg-amber-950/30 text-amber-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status.toLowerCase()] ??
        "border-gray-700 bg-gray-900/50 text-gray-300"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatPhoneType(type: string | null | undefined) {
  switch (type?.toLowerCase()) {
    case "cell":
    case "mobile":
      return "Cell";

    case "business":
      return "Business";

    case "work":
      return "Work";

    case "home":
      return "Home";

    case "other":
      return "Other";

    default:
      return "Phone";
  }
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAddress(
  line1: string | null | undefined,
  line2: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  postalCode: string | null | undefined,
) {
  const streetLines = [line1, line2].filter(Boolean);

  const cityStateZip = [city, [state, postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return [...streetLines, cityStateZip].filter(Boolean).join("\n");
}

function formatPropertyLocation(
  city: string | null | undefined,
  state: string | null | undefined,
  postalCode: string | null | undefined,
): string {
  const cityState = [city, state].filter(Boolean).join(", ");
  const location = [cityState, postalCode].filter(Boolean).join(" ");

  return location || "Location not provided";
}

function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}