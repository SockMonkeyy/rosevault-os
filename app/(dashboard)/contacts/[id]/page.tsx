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
      .select(
        `
        property_id,
        relationship_type,
        is_primary
      `,
      )
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
        .select(
          `
          id,
          property_address_line_1,
          property_address_line_2,
          property_city,
          property_state,
          property_postal_code,
          property_type,
          property_status,
          estimated_value
        `,
        )
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
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-12 lg:py-16">
      {/* Editorial Header Section */}
      <header className="mb-12 flex flex-col justify-between gap-6 border-b border-[#EDE7DC]/60 pb-8 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <Link
            href="/contacts"
            className="group inline-flex cursor-pointer items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F] transition-colors duration-300 hover:text-[#916520]"
          >
            <span className="mr-1 transform transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>{" "}
            Back to Registry
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
              {fullName}
            </h1>

            {contact.contact_type && (
              <span className="rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-3 py-0.5 text-[11px] font-medium capitalize tracking-wide text-[#B7832F]">
                {formatLabel(contact.contact_type)}
              </span>
            )}

            {contact.status && <StatusBadge status={contact.status} />}
          </div>

          <p className="text-xs tracking-wide text-[#7C7265]">
            {contact.company || "Contact Profile"}{" "}
            {contact.job_title ? ` · ${contact.job_title}` : ""}
          </p>
        </div>

        {/* Header Action Anchors */}
        <div className="flex flex-wrap items-center gap-3">
          {contact.email && (
            <Link
              href={`/email/compose?contacts=${contact.id}`}
              className="cursor-pointer rounded-md border border-[#EDE7DC] bg-white/50 px-5 py-2.5 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:border-[#C4BCB1] hover:bg-white/90 hover:text-[#29231D]"
            >
              Compose Email
            </Link>
          )}

          <Link
            href={`/contacts/${contact.id}/edit`}
            className="cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-2.5 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.98]"
          >
            Edit Contact
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout Columns */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Left Side: Core Dossier Elements */}
        <div className="space-y-8 xl:col-span-2">
          {/* Contact Details Information */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <div className="mb-6">
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Contact Details
              </h2>
              <p className="mt-1 text-xs text-[#7C7265]">
                Primary secure contact channels and active outreach alignment
                preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ContactLinkItem
                label="E-mail Address"
                value={contact.email}
                href={contact.email ? `mailto:${contact.email}` : undefined}
              />
              <PhoneItem
                label="Primary Line"
                value={contact.primary_phone}
                type={contact.primary_phone_type}
              />

              <PhoneItem
                label="Secondary Line"
                value={contact.secondary_phone}
                type={contact.secondary_phone_type}
              />
            </div>
          </section>

          {/* Connected Portfolio Property Relationships */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                  Linked Properties
                </h2>
                <p className="mt-1 text-xs text-[#7C7265]">
                  Properties securely mapped to this direct relationship inside
                  your workspace archives.
                </p>
              </div>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#171512] px-2.5 text-[11px] font-semibold tracking-wider text-[#D8B66A]">
                {linkedPropertyRows.length}
              </span>
            </div>

            {linkedPropertyRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] px-5 py-10 text-center">
                <p className="text-xs text-[#7C7265]">
                  No properties are currently linked to this relationship
                  dossier.
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#A89C8D]">
                  Link directly within an alternative Property Dashboard to
                  establish dynamic graph connections.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {linkedPropertyRows.map((property) => {
                  const address =
                    property.property_address_line_1 ||
                    "Unnamed Vaulted Property";
                  const location = formatPropertyLocation(
                    property.property_city,
                    property.property_state,
                    property.property_postal_code,
                  );

                  return (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="group block cursor-pointer rounded-xl border border-[#EDE7DC] bg-white/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/90 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-sm font-medium text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
                              {address}
                            </h3>
                            {property.is_primary && (
                              <span className="rounded-full border border-[#D8B66A]/40 bg-[#B7832F]/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#B7832F]">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#7C7265]">{location}</p>
                          {property.estimated_value !== null &&
                            property.estimated_value !== undefined && (
                              <p className="text-[11px] font-medium text-[#8F8578]">
                                Valuation Estimate:{" "}
                                <span className="font-serif text-xs text-[#B7832F]">
                                  {formatCurrency(property.estimated_value)}
                                </span>
                              </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {property.relationship_type && (
                            <span className="rounded bg-[#171512]/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#7C7265]">
                              {formatLabel(property.relationship_type)}
                            </span>
                          )}
                          {property.property_status && (
                            <span className="rounded border border-[#EDE7DC] px-2 py-1 text-[10px] text-[#A89C8D]">
                              {formatLabel(property.property_status)}
                            </span>
                          )}
                          {property.property_type && (
                            <span className="rounded border border-[#EDE7DC] px-2 py-1 text-[10px] text-[#A89C8D]">
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

          {/* Multi-Activity Related Ledger Metrics */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <div className="mb-6">
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Activity{" "}
              </h2>
              <p className="mt-1 text-xs text-[#7C7265]">
                Cross-referenced operational records tied to this custom system
                dossier.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <RelatedRecordCard
                title="Transactions"
                description="Acquisitions, traditional sales, wholesales, or private assignments."
                count={0}
                status="Pipeline Lock"
              />
              <RelatedRecordCard
                title="Tasks"
                description="Calendar follow-ups and active automated items."
                count={0}
                status="Pipeline Lock"
              />
              <RelatedRecordCard
                title="Documents"
                description="Secure transaction binders, disclosures, and email logs."
                count={0}
                status="Pipeline Lock"
              />
            </div>
          </section>

          {/* Co-Signer / Spouse Details Block */}
          {hasSpouseInfo && (
            <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
              <div className="mb-6">
                <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                  Secondary / Partner Association
                </h2>
                <p className="mt-1 text-xs text-[#7C7265]">
                  Auxiliary credentials listed concurrently on this workspace
                  relationship roster.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoItem label="Legal Name" value={spouseName || null} />
                <ContactLinkItem
                  label="Electronic Mail"
                  value={contact.spouse_email}
                  href={
                    contact.spouse_email
                      ? `mailto:${contact.spouse_email}`
                      : undefined
                  }
                />
                <PhoneItem
                  label="Primary Contact Line"
                  value={contact.spouse_primary_phone}
                  type={contact.spouse_primary_phone_type}
                />

                <PhoneItem
                  label="Secondary Contact Line"
                  value={contact.spouse_secondary_phone}
                  type={contact.spouse_secondary_phone_type}
                />
              </div>
            </section>
          )}

          {/* Physical Mailing Address Mapping */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <div className="mb-4">
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Mailing Address
              </h2>
              <p className="mt-1 text-xs text-[#7C7265]">
                Preferred geographic routing location for formal corporate
                lookbooks and mailings.
              </p>
            </div>
            <AddressDisplay address={mailingAddress} />
          </section>

          {/* Direct Single Address Mapping */}
          {hasPropertyAddress && (
            <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
              <div className="mb-4">
                <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                  Record Property Address
                </h2>
                <p className="mt-1 text-xs text-[#7C7265]">
                  The property location address saved directly against this
                  singular profile database index.
                </p>
              </div>
              <AddressDisplay address={propertyAddress} />
            </section>
          )}

          {/* Workspace Notebook Memorandums */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <div className="mb-5">
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Notes
              </h2>
              <p className="mt-1 text-xs text-[#7C7265]">
                Unique details added over time
              </p>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#7C7265]">
              {contact.notes ||
                "No additional memorandum summaries have been appended to this account record."}
            </p>
          </section>
        </div>

        {/* Right Side: Sticky Context/Categorization Sidebar */}
        <div className="space-y-6">
          {/* Registry Particulars Details Box */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <h2 className="font-serif text-base font-normal tracking-wide text-[#29231D]">
              CRM Categorization
            </h2>

            <div className="mt-6 space-y-4">
              <InfoItem label="Contact Type" value={contact.contact_type} />
              <InfoItem label="Status" value={contact.status} />
              <InfoItem label="Lead Source" value={contact.lead_source} />
              <InfoItem label="Company" value={contact.company} />
              <InfoItem label="Professional Title" value={contact.job_title} />
              <InfoItem
                label="Preferred Contact Method"
                value={contact.preferred_contact_method}
              />
            </div>
          </section>

          {/* Dynamic Component Interactivity Container */}
          <div className="rounded-xl border border-[#EDE7DC] bg-white/10 p-2 backdrop-blur-sm">
            <ContactGroupsTags
              contactId={contact.id}
              organizationId={membership.organization_id}
              groups={groups ?? []}
              tags={tags ?? []}
              assignedGroupIds={assignedGroupIds}
              assignedTagIds={assignedTagIds}
            />
          </div>

          {/* Quick Access Panel */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
            <h2 className="font-serif text-base font-normal tracking-wide text-[#29231D]">
              Quick Access
            </h2>

            <div className="mt-5 space-y-2.5">
              {contact.email ? (
                <Link
                  href={`/email/compose?contacts=${contact.id}`}
                  className="group block w-full cursor-pointer rounded-md border border-[#EDE7DC] bg-white/60 py-2.5 text-center text-xs font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                >
                  Send Email
                </Link>
              ) : (
                <div className="rounded-md border border-[#EDE7DC]/60 bg-[#12110F]/[0.01] py-2.5 text-center text-[11px] tracking-wide text-[#A89C8D]">
                  No Email Address Available
                </div>
              )}

              <Link
                href={`/contacts/${contact.id}/edit`}
                className="group block w-full cursor-pointer rounded-md border border-[#EDE7DC] bg-white/60 py-2.5 text-center text-xs font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
              >
                Modify Linked Properties
              </Link>

              {linkedPropertyRows.length > 0 && (
                <Link
                  href={`/properties/${linkedPropertyRows[0].id}`}
                  className="group block w-full cursor-pointer rounded-md border border-[#EDE7DC] bg-white/60 py-2.5 text-center text-xs font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                >
                  Inspect Associated Real Estate
                </Link>
              )}
            </div>
          </section>

          {/* Rosie Insight Engine Container */}
          <section className="rounded-xl border border-[#D8B66A]/25 bg-[#12110F]/[0.02] p-6 transition-all duration-300 hover:border-[#D8B66A]/40 hover:bg-[#12110F]/[0.04]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Rosie AI
            </p>
            <h2 className="mt-2 font-serif text-lg font-normal tracking-wide text-[#29231D]">
              Intelligence Matrix
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-[#7C7265]">
              Rosie will parse incoming lookbooks, monitor transactional
              correspondence parameters, and isolate upcoming portfolio action
              triggers for this profile.
            </p>
          </section>
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
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A89C8D]">
        {label}
      </p>
      <p className="text-xs font-medium text-[#29231D]">
        {value ? formatLabel(value) : "—"}
      </p>
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
    <div className="group cursor-pointer rounded-xl border border-[#EDE7DC] bg-white/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/30 hover:bg-white/80">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-serif text-sm font-medium text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
            {title}
          </h3>
          <p className="text-[11px] leading-relaxed text-[#7C7265]">
            {description}
          </p>
        </div>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#171512]/5 px-2 text-[10px] font-semibold text-[#29231D]">
          {count}
        </span>
      </div>

      {status && (
        <div className="mt-4 border-t border-[#EDE7DC]/60 pt-3">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#A89C8D]">
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
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A89C8D]">
        {label}
      </p>
      {value && href ? (
        <a
          href={href}
          className="inline-block cursor-pointer break-all text-xs font-medium text-[#29231D] transition-colors duration-300 hover:text-[#B7832F] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-xs text-[#A89C8D]">—</p>
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
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A89C8D]">
        {label}
      </p>
      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`tel:${value}`}
            className="cursor-pointer text-xs font-medium text-[#29231D] transition-colors duration-300 hover:text-[#B7832F] hover:underline"
          >
            {value}
          </a>

          {type && (
            <span className="rounded bg-[#171512]/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#7C7265]">
              {formatPhoneType(type)}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#A89C8D]">—</p>
      )}
    </div>
  );
}

function AddressDisplay({ address }: { address: string }) {
  return (
    <p className="whitespace-pre-line text-xs leading-relaxed text-[#7C7265]">
      {address || "—"}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-[#EDE7DC] bg-[#12110F]/5 text-[#7C7265]",
    lead: "border-sky-200 bg-sky-50 text-sky-700",
    prospect: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
        styles[status.toLowerCase()] ??
        "border-[#EDE7DC] bg-white text-[#7C7265]"
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

// Capitalize and format raw string slugs nicely
function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  return (
    [cityState, postalCode].filter(Boolean).join(" ") ||
    "Location information absent"
  );
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}
