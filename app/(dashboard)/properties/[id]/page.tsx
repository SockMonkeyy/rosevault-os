import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PropertyContactManager from "@/app/components/PropertyContactManager";
import { createClient } from "@/lib/supabase/server";

type PropertyProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ContactRelationship = {
  contact_id: string;
  relationship_type: string | null;
  is_primary: boolean | null;
};

type ContactRecord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  contact_type: string | null;
};

export default async function PropertyProfilePage({
  params,
}: PropertyProfilePageProps) {
  const { id: propertyId } = await params;

  const supabase = await createClient();

  // Verify signed-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify organization membership
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("Error loading organization membership:", membershipError);
  }

  if (!membership) {
    redirect("/onboarding");
  }

  // Load the property
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
      created_at,
      updated_at
    `)
    .eq("id", propertyId)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (propertyError) {
    console.error("Error loading property:", propertyError);
    notFound();
  }

  if (!property) {
    notFound();
  }

  // Load existing property-contact relationships and all available contacts.
  const [
    { data: relationshipsData, error: relationshipsError },
    { data: allContactsData, error: contactsError },
  ] = await Promise.all([
    supabase
      .from("contact_property_relationships")
      .select(`
        contact_id,
        relationship_type,
        is_primary
      `)
      .eq("organization_id", membership.organization_id)
      .eq("property_id", property.id),

    supabase
      .from("contacts")
      .select(`
        id,
        first_name,
        last_name,
        email,
        primary_phone,
        secondary_phone,
        contact_type
      `)
      .eq("organization_id", membership.organization_id)
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true }),
  ]);

  if (relationshipsError) {
    console.error(
      "Error loading property contact relationships:",
      relationshipsError,
    );
  }

  if (contactsError) {
    console.error(
      "Error loading contacts for property linking:",
      contactsError,
    );
  }

  const relationships = (relationshipsData ?? []) as ContactRelationship[];
  const allContacts = (allContactsData ?? []) as ContactRecord[];

  const linkedContactIds = relationships.map(
    (relationship) => relationship.contact_id,
  );

  // Load full contact records for contacts already linked to this property.
  let linkedContacts: ContactRecord[] = [];

  if (linkedContactIds.length > 0) {
    const { data, error } = await supabase
      .from("contacts")
      .select(`
        id,
        first_name,
        last_name,
        email,
        primary_phone,
        secondary_phone,
        contact_type
      `)
      .eq("organization_id", membership.organization_id)
      .in("id", linkedContactIds);

    if (error) {
      console.error("Error loading linked contacts:", error);
    } else {
      linkedContacts = (data ?? []) as ContactRecord[];
    }
  }

  const linkedContactRows = relationships
    .map((relationship) => {
      const contact = linkedContacts.find(
        (item) => item.id === relationship.contact_id,
      );

      if (!contact) {
        return null;
      }

      return {
        ...contact,
        relationship_type: relationship.relationship_type,
        is_primary: relationship.is_primary,
      };
    })
    .filter(
      (
        contact,
      ): contact is ContactRecord & {
        relationship_type: string | null;
        is_primary: boolean | null;
      } => contact !== null,
    );

  const estimatedEquity = calculateEstimatedEquity(
    property.estimated_value,
    property.mortgage_balance,
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/properties"
              className="mb-4 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
            >
              ← Back to Properties
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">
                {property.property_address_line_1 || "Unnamed Property"}
              </h1>

              {property.property_status && (
                <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-medium capitalize text-[#d4af37]">
                  {formatLabel(property.property_status)}
                </span>
              )}
            </div>

            <p className="mt-2 text-gray-400">
              {formatPropertyLocation(
                property.property_city,
                property.property_state,
                property.property_postal_code,
              )}
            </p>
          </div>

          <Link
            href={`/properties/${property.id}/edit`}
            className="rounded-lg bg-[#d4af37] px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            Edit Property
          </Link>
        </div>

        {/* Financial summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Estimated Value"
            value={formatCurrency(property.estimated_value)}
          />

          <SummaryCard
            label="Asking Price"
            value={formatCurrency(property.asking_price)}
          />

          <SummaryCard
            label="Mortgage Balance"
            value={formatCurrency(property.mortgage_balance)}
          />

          <SummaryCard
            label="Estimated Equity"
            value={formatCurrency(estimatedEquity)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Property Address */}
            <SectionCard
              title="Property Address"
              description="The physical location associated with this property record."
            >
              <div className="text-sm leading-7 text-white">
                <p>
                  {property.property_address_line_1 || "—"}
                </p>

                {property.property_address_line_2 && (
                  <p>{property.property_address_line_2}</p>
                )}

                <p>
                  {formatPropertyLocation(
                    property.property_city,
                    property.property_state,
                    property.property_postal_code,
                  )}
                </p>
              </div>
            </SectionCard>

            {/* Property Details */}
            <SectionCard
              title="Property Details"
              description="Physical characteristics and identifying information."
            >
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Property Type"
                  value={formatLabel(property.property_type)}
                />

                <DetailItem
                  label="Status"
                  value={formatLabel(property.property_status)}
                />

                <DetailItem
                  label="County"
                  value={property.county}
                />

                <DetailItem
                  label="Parcel Number"
                  value={property.parcel_number}
                />

                <DetailItem
                  label="Bedrooms"
                  value={formatNumber(property.bedrooms)}
                />

                <DetailItem
                  label="Bathrooms"
                  value={formatNumber(property.bathrooms)}
                />

                <DetailItem
                  label="Square Feet"
                  value={
                    property.square_feet !== null &&
                    property.square_feet !== undefined
                      ? Number(property.square_feet).toLocaleString("en-US")
                      : null
                  }
                />

                <DetailItem
                  label="Year Built"
                  value={formatNumber(property.year_built)}
                />
              </div>
            </SectionCard>

            {/* Financial Information */}
            <SectionCard
              title="Financial Information"
              description="Property valuation, seller expectations, mortgage balance, and estimated equity."
            >
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <DetailItem
                  label="Estimated Value"
                  value={formatCurrency(property.estimated_value)}
                />

                <DetailItem
                  label="Asking Price"
                  value={formatCurrency(property.asking_price)}
                />

                <DetailItem
                  label="Mortgage Balance"
                  value={formatCurrency(property.mortgage_balance)}
                />

                <DetailItem
                  label="Estimated Equity"
                  value={formatCurrency(estimatedEquity)}
                />
              </div>
            </SectionCard>

            {/* Linked Contacts */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Linked Contacts
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    People and business relationships associated with this
                    property.
                  </p>
                </div>

                <PropertyContactManager
                  propertyId={property.id}
                  organizationId={membership.organization_id}
                  contacts={allContacts}
                  linkedContactIds={linkedContactIds}
                />
              </div>

              {linkedContactRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#333333] bg-[#111111] px-5 py-10 text-center">
                  <p className="text-sm text-gray-500">
                    No contacts are currently linked to this property.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Use the Link Contact button above to connect an existing
                    RoseVault contact to this property.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedContactRows.map((contact) => {
                    const fullName =
                      [contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Contact";

                    const displayPhone =
                      contact.primary_phone || contact.secondary_phone;

                    return (
                      <div
                        key={contact.id}
                        className="flex flex-col gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="font-medium text-white transition hover:text-[#d4af37]"
                            >
                              {fullName}
                            </Link>

                            {contact.is_primary && (
                              <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#d4af37]">
                                Primary
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            {contact.email && <span>{contact.email}</span>}

                            {displayPhone && <span>{displayPhone}</span>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {contact.relationship_type && (
                            <span className="rounded-full border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium capitalize text-gray-300">
                              {formatLabel(contact.relationship_type)}
                            </span>
                          )}

                          {contact.contact_type && (
                            <span className="rounded-full border border-[#333333] px-3 py-1.5 text-xs capitalize text-gray-500">
                              {formatLabel(contact.contact_type)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Notes */}
            <SectionCard
              title="Notes"
              description="Property condition, seller situation, repair needs, and other important context."
            >
              {property.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {property.notes}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  No notes have been added to this property.
                </p>
              )}
            </SectionCard>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Property Record */}
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Property Record
              </h2>

              <div className="mt-6 space-y-6">
                <DetailItem
                  label="Status"
                  value={formatLabel(property.property_status)}
                />

                <DetailItem
                  label="Property Type"
                  value={formatLabel(property.property_type)}
                />

                <DetailItem
                  label="County"
                  value={property.county}
                />

                <DetailItem
                  label="Parcel Number"
                  value={property.parcel_number}
                />

                <DetailItem
                  label="Created"
                  value={formatDate(property.created_at)}
                />

                {property.updated_at && (
                  <DetailItem
                    label="Last Updated"
                    value={formatDate(property.updated_at)}
                  />
                )}
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

                <Link
                  href="/properties"
                  className="block w-full rounded-lg border border-[#333333] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  View All Properties
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-sm text-gray-400">{label}</p>

      <p className="mt-3 text-2xl font-semibold text-[#d4af37]">
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "";

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-sm text-white">
        {hasValue ? value : "—"}
      </p>
    </div>
  );
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

function formatNumber(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return numericValue.toLocaleString("en-US");
}

function calculateEstimatedEquity(
  estimatedValue: number | string | null | undefined,
  mortgageBalance: number | string | null | undefined,
): number | null {
  if (
    estimatedValue === null ||
    estimatedValue === undefined ||
    estimatedValue === ""
  ) {
    return null;
  }

  const value = Number(estimatedValue);
  const mortgage =
    mortgageBalance === null ||
    mortgageBalance === undefined ||
    mortgageBalance === ""
      ? 0
      : Number(mortgageBalance);

  if (!Number.isFinite(value) || !Number.isFinite(mortgage)) {
    return null;
  }

  return value - mortgage;
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

function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined): string {
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