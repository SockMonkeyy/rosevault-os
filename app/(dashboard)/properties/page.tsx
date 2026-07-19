import Link from "next/link";
import { redirect } from "next/navigation";
import PropertiesTable from "@/app/components/PropertiesTable";
import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;

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
    .select(
      `
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
    `,
    )
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (propertiesError) {
    console.error("Error loading properties:", propertiesError);
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("contact_property_relationships")
    .select(
      `
      property_id,
      contact_id,
      relationship_type,
      is_primary
    `,
    )
    .eq("organization_id", membership.organization_id);

  if (relationshipsError) {
    console.error("Error loading property relationships:", relationshipsError);
  }

  const uniqueLinkedPropertyIds = new Set(
    (relationships ?? []).map((relationship) => relationship.property_id),
  );

  const prospectCount =
    properties?.filter((property) => property.property_status === "prospect")
      .length ?? 0;

  return (
    <div className="min-h-screen bg-[#FBF9F6] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm font-medium text-[#7C7265] transition hover:text-[#B7832F]"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="font-serif text-3xl font-normal text-[#B7832F]">
              Properties
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#5C544A]">
              Manage properties, ownership relationships, property details,
              values, and opportunities throughout RoseVault.
            </p>
          </div>

          <Link
            href="/properties/new"
            className="rounded-lg bg-[#B7832F] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#D8B66A]"
          >
            + Add Property
          </Link>
        </div>

        {deleted === "true" && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50/80 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                ✓
              </div>

              <div>
                <p className="font-medium text-green-800">
                  Property deleted successfully.
                </p>

                <p className="text-sm text-green-700">
                  The property has been permanently removed from RoseVault.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Properties"
            value={properties?.length ?? 0}
          />

          <SummaryCard label="Prospects" value={prospectCount} />

          <SummaryCard
            label="Linked Properties"
            value={uniqueLinkedPropertyIds.size}
          />

          <SummaryCard
            label="Unlinked Properties"
            value={(properties?.length ?? 0) - uniqueLinkedPropertyIds.size}
          />
        </div>

        {/* Property library */}
        {!properties || properties.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-[#EDE7DC] bg-white/45 p-8 backdrop-blur-sm">
            <div className="max-w-md text-center">
              <h2 className="font-serif text-xl font-normal text-[#B7832F]">
                No properties yet
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#7C7265]">
                Add your first property manually or import contacts and
                properties together from a CSV file.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/properties/new"
                  className="rounded-lg bg-[#B7832F] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#D8B66A]"
                >
                  + Add Your First Property
                </Link>

                <Link
                  href="/contacts/import"
                  className="rounded-lg border border-[#EDE7DC] bg-white/50 px-5 py-3 text-sm font-medium text-[#7C7265] transition hover:border-[#D8B66A]/40 hover:bg-white hover:text-[#B7832F]"
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
      </p>

      <p className="mt-3 font-serif text-3xl font-normal text-[#B7832F]">
        {value}
      </p>
    </div>
  );
}
