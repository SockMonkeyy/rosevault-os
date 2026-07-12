import Link from "next/link";
import { redirect } from "next/navigation";
import PropertiesTable from "@/app/components/PropertiesTable";
import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage() {
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

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select(`
      id,
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
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (propertiesError) {
    console.error("Error loading properties:", propertiesError);
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("contact_property_relationships")
    .select(`
      property_id,
      contact_id,
      relationship_type,
      is_primary
    `)
    .eq("organization_id", membership.organization_id);

  if (relationshipsError) {
    console.error(
      "Error loading property relationships:",
      relationshipsError,
    );
  }

  const uniqueLinkedPropertyIds = new Set(
    (relationships ?? []).map((relationship) => relationship.property_id),
  );

  const prospectCount =
    properties?.filter(
      (property) => property.property_status === "prospect",
    ).length ?? 0;

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

            <h1 className="text-3xl font-semibold text-white">
              Properties
            </h1>

            <p className="mt-2 max-w-2xl text-gray-400">
              Manage properties, ownership relationships, property details,
              values, and opportunities throughout RoseVault.
            </p>
          </div>

          <Link
            href="/properties/new"
            className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            + Add Property
          </Link>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Properties"
            value={properties?.length ?? 0}
          />

          <SummaryCard
            label="Prospects"
            value={prospectCount}
          />

          <SummaryCard
            label="Linked Properties"
            value={uniqueLinkedPropertyIds.size}
          />

          <SummaryCard
            label="Unlinked Properties"
            value={
              (properties?.length ?? 0) - uniqueLinkedPropertyIds.size
            }
          />
        </div>

        {/* Property library */}
        {!properties || properties.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#151515] p-8">
            <div className="max-w-md text-center">
              <h2 className="text-xl font-semibold text-white">
                No properties yet
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Add your first property manually or import contacts and
                properties together from a CSV file.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/properties/new"
                  className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
                >
                  + Add Your First Property
                </Link>

                <Link
                  href="/contacts/import"
                  className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Import CSV
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <PropertiesTable
            properties={properties}
            relationships={relationships ?? []}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
        {value}
      </p>
    </div>
  );
}