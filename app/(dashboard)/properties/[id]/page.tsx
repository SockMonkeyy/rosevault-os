import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PropertyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  // Get property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select(`
      id,
      organization_id,
      property_address_line_1,
      property_address_line_2,
      property_city,
      property_state,
      property_postal_code,
      county,
      parcel_number,
      property_type,
      property_status,
      bedrooms,
      bathrooms,
      square_feet,
      year_built,
      estimated_value,
      asking_price,
      mortgage_balance,
      notes,
      created_at
    `)
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (propertyError) {
    console.error("Error loading property:", propertyError);
  }

  if (!property) {
    notFound();
  }

  // Get relationships for this property
  const { data: relationships, error: relationshipsError } = await supabase
    .from("contact_property_relationships")
    .select(`
      contact_id,
      relationship_type,
      is_primary
    `)
    .eq("organization_id", membership.organization_id)
    .eq("property_id", property.id);

  if (relationshipsError) {
    console.error(
      "Error loading property relationships:",
      relationshipsError,
    );
  }

  // Get related contacts separately so we do not assume
  // a nested Supabase relationship exists.
  const contactIds = Array.from(
    new Set(
      (relationships ?? [])
        .map((relationship) => relationship.contact_id)
        .filter(Boolean),
    ),
  );

  let relatedContacts: RelatedContact[] = [];

  if (contactIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(`
        id,
        first_name,
        last_name,
        email,
        cell_phone,
        cell_phone_type,
        business_phone,
        business_phone_type,
        contact_type,
        status
      `)
      .eq("organization_id", membership.organization_id)
      .in("id", contactIds);

    if (contactsError) {
      console.error("Error loading related contacts:", contactsError);
    }

    relatedContacts = contacts ?? [];
  }

  const contactsById = new Map(
    relatedContacts.map((contact) => [contact.id, contact]),
  );

  const linkedContacts = (relationships ?? []).map((relationship) => ({
    ...relationship,
    contact: contactsById.get(relationship.contact_id) ?? null,
  }));

  const fullAddress = formatAddress(
    property.property_address_line_1,
    property.property_address_line_2,
    property.property_city,
    property.property_state,
    property.property_postal_code,
  );

  const financialValues = [
    property.estimated_value,
    property.asking_price,
    property.mortgage_balance,
  ].filter(
    (value): value is number =>
      value !== null &&
      value !== undefined &&
      Number.isFinite(Number(value)),
  );

  const hasFinancialInformation = financialValues.length > 0;

  const estimatedEquity =
    property.estimated_value !== null &&
    property.estimated_value !== undefined &&
    property.mortgage_balance !== null &&
    property.mortgage_balance !== undefined
      ? Number(property.estimated_value) - Number(property.mortgage_balance)
      : null;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Back navigation */}
        <Link
          href="/properties"
          className="mb-5 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
        >
          ← Back to Properties
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">
                {property.property_address_line_1 || "Unnamed Property"}
              </h1>

              <StatusBadge status={property.property_status} />
            </div>

            <p className="text-gray-400">
              {formatCityStateZip(property)}
            </p>

            {property.property_type && (
              <p className="mt-2 text-sm text-gray-500">
                {formatLabel(property.property_type)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/properties/${property.id}/edit`}
              className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
            >
              Edit Property
            </Link>
          </div>
        </div>

        {/* Snapshot cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            label="Estimated Value"
            value={formatCurrency(property.estimated_value)}
          />

          <SnapshotCard
            label="Asking Price"
            value={formatCurrency(property.asking_price)}
          />

          <SnapshotCard
            label="Mortgage Balance"
            value={formatCurrency(property.mortgage_balance)}
          />

          <SnapshotCard
            label="Estimated Equity"
            value={formatCurrency(estimatedEquity)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 xl:col-span-2">
            {/* Property Address */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <SectionHeader
                title="Property Address"
                description="The physical location associated with this property record."
              />

              <p className="whitespace-pre-line text-sm leading-7 text-gray-200">
                {fullAddress || "—"}
              </p>
            </section>

            {/* Property Details */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <SectionHeader
                title="Property Details"
                description="Physical characteristics and identifying information."
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  label="Property Type"
                  value={
                    property.property_type
                      ? formatLabel(property.property_type)
                      : null
                  }
                />

                <InfoItem
                  label="Status"
                  value={
                    property.property_status
                      ? formatLabel(property.property_status)
                      : null
                  }
                />

                <InfoItem
                  label="County"
                  value={property.county}
                />

                <InfoItem
                  label="Parcel Number"
                  value={property.parcel_number}
                />

                <InfoItem
                  label="Bedrooms"
                  value={formatNumber(property.bedrooms)}
                />

                <InfoItem
                  label="Bathrooms"
                  value={formatNumber(property.bathrooms)}
                />

                <InfoItem
                  label="Square Feet"
                  value={formatSquareFeet(property.square_feet)}
                />

                <InfoItem
                  label="Year Built"
                  value={formatNumber(property.year_built)}
                />
              </div>
            </section>

            {/* Financial Information */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <SectionHeader
                title="Financial Information"
                description="Known property values, seller expectations, and mortgage information."
              />

              {hasFinancialInformation ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InfoItem
                    label="Estimated Value"
                    value={formatCurrency(property.estimated_value)}
                  />

                  <InfoItem
                    label="Asking Price"
                    value={formatCurrency(property.asking_price)}
                  />

                  <InfoItem
                    label="Mortgage Balance"
                    value={formatCurrency(property.mortgage_balance)}
                  />

                  <InfoItem
                    label="Estimated Equity"
                    value={formatCurrency(estimatedEquity)}
                    accent={estimatedEquity !== null}
                  />
                </div>
              ) : (
                <EmptyStateText>
                  No financial information has been added yet.
                </EmptyStateText>
              )}
            </section>

            {/* Linked Contacts */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <SectionHeader
                title="Linked Contacts"
                description="People and business relationships associated with this property."
              />

              {linkedContacts.length === 0 ? (
                <EmptyStateText>
                  No contacts are currently linked to this property.
                </EmptyStateText>
              ) : (
                <div className="space-y-3">
                  {linkedContacts.map((relationship, index) => {
                    const contact = relationship.contact;

                    if (!contact) {
                      return (
                        <div
                          key={`${relationship.contact_id}-${relationship.relationship_type}-${index}`}
                          className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
                        >
                          <p className="text-sm text-gray-400">
                            Linked contact record unavailable.
                          </p>

                          <p className="mt-2 text-xs text-gray-600">
                            Relationship:{" "}
                            {formatLabel(relationship.relationship_type)}
                          </p>
                        </div>
                      );
                    }

                    const fullName =
                      [contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Contact";

                    return (
                      <div
                        key={`${contact.id}-${relationship.relationship_type}-${index}`}
                        className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="font-medium text-white transition hover:text-[#d4af37]"
                              >
                                {fullName}
                              </Link>

                              <RelationshipBadge
                                type={relationship.relationship_type}
                              />

                              {relationship.is_primary && (
                                <span className="rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d4af37]">
                                  Primary
                                </span>
                              )}
                            </div>

                            <div className="mt-3 space-y-1">
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="block break-all text-sm text-gray-400 transition hover:text-[#d4af37]"
                                >
                                  {contact.email}
                                </a>
                              )}

                              {contact.cell_phone && (
                                <a
                                  href={`tel:${contact.cell_phone}`}
                                  className="block text-sm text-gray-400 transition hover:text-[#d4af37]"
                                >
                                  {contact.cell_phone}
                                </a>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/contacts/${contact.id}`}
                            className="shrink-0 rounded-lg border border-[#333333] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                          >
                            View Contact
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <SectionHeader
                title="Property Notes"
                description="Condition, seller situation, repair needs, and other important context."
              />

              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-400">
                {property.notes || "No property notes have been added yet."}
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Record */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Property Record
              </h2>

              <div className="mt-6 space-y-5">
                <InfoItem
                  label="Status"
                  value={
                    property.property_status
                      ? formatLabel(property.property_status)
                      : null
                  }
                />

                <InfoItem
                  label="Property Type"
                  value={
                    property.property_type
                      ? formatLabel(property.property_type)
                      : null
                  }
                />

                <InfoItem
                  label="County"
                  value={property.county}
                />

                <InfoItem
                  label="Parcel Number"
                  value={property.parcel_number}
                />

                <InfoItem
                  label="Created"
                  value={formatDate(property.created_at)}
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Quick Actions
              </h2>

              <div className="mt-5 space-y-3">
                <Link
                  href={`/properties/${property.id}/edit`}
                  className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Edit Property
                </Link>

                <Link
                  href="/contacts/new"
                  className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Add New Contact
                </Link>
              </div>
            </section>

            {/* Future related records */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Related Records
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Additional RoseVault records that will eventually connect to
                this property.
              </p>

              <div className="mt-5 space-y-3">
                <FutureRecordRow
                  label="Transactions"
                  status="Coming soon"
                />

                <FutureRecordRow
                  label="Tasks"
                  status="Coming soon"
                />

                <FutureRecordRow
                  label="Documents"
                  status="Coming soon"
                />
              </div>
            </section>

            {/* Rosie AI */}
            <section className="rounded-2xl border border-[#d4af37]/30 bg-[#151515] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                Rosie AI
              </p>

              <h2 className="mt-3 text-xl font-semibold text-white">
                Property Intelligence
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Rosie will eventually analyze property details, equity,
                seller context, linked contacts, transactions, and activity
                to recommend the next best action.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

type RelatedContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  cell_phone: string | null;
  cell_phone_type: string | null;
  business_phone: string | null;
  business_phone_type: string | null;
  contact_type: string | null;
  status: string | null;
};

type PropertyAddressFields = {
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#d4af37]">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | null | undefined;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-2 ${
          accent ? "font-medium text-[#d4af37]" : "text-gray-200"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function EmptyStateText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#333333] bg-[#111111] px-5 py-8 text-center">
      <p className="text-sm text-gray-500">
        {children}
      </p>
    </div>
  );
}

function RelationshipBadge({
  type,
}: {
  type: string;
}) {
  return (
    <span className="rounded-full border border-[#333333] bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-gray-300">
      {formatLabel(type)}
    </span>
  );
}

function FutureRecordRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2a2a] bg-[#111111] px-4 py-3">
      <span className="text-sm text-gray-300">
        {label}
      </span>

      <span className="text-xs text-gray-600">
        {status}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status) {
    return null;
  }

  const styles: Record<string, string> = {
    prospect:
      "border-amber-900/50 bg-amber-950/30 text-amber-300",
    active:
      "border-green-900/50 bg-green-950/30 text-green-300",
    under_contract:
      "border-blue-900/50 bg-blue-950/30 text-blue-300",
    closed:
      "border-purple-900/50 bg-purple-950/30 text-purple-300",
    inactive:
      "border-gray-700 bg-gray-900/50 text-gray-400",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "border-gray-700 bg-gray-900/50 text-gray-300"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
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

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Number(value));
}

function formatSquareFeet(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US").format(Number(value))} sq ft`;
}

function formatCityStateZip(property: PropertyAddressFields) {
  const cityState = [
    property.property_city,
    property.property_state,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    cityState,
    property.property_postal_code,
  ]
    .filter(Boolean)
    .join(" ") || "—";
}

function formatAddress(
  line1: string | null | undefined,
  line2: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  postalCode: string | null | undefined,
) {
  const streetLines = [line1, line2].filter(Boolean);

  const cityStateZip = [
    city,
    [state, postalCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return [...streetLines, cityStateZip]
    .filter(Boolean)
    .join("\n");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}