"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Property = {
  id: string;
  property_address_line_1: string;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
  county: string | null;
  parcel_number: string | null;
  property_type: string | null;
  property_status: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  estimated_value: number | null;
  asking_price: number | null;
  mortgage_balance: number | null;
  notes: string | null;
  created_at: string;
};

type PropertyRelationship = {
  property_id: string;
  contact_id: string;
  relationship_type: string;
  is_primary: boolean;
};

type Props = {
  properties: Property[];
  relationships: PropertyRelationship[];
};

export default function PropertiesTable({
  properties,
  relationships,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          properties
            .map((property) => property.property_status)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [properties],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          properties
            .map((property) => property.property_type)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [properties],
  );

  const relationshipCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const relationship of relationships) {
      counts.set(
        relationship.property_id,
        (counts.get(relationship.property_id) ?? 0) + 1,
      );
    }

    return counts;
  }, [relationships]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const searchableValues = [
        property.property_address_line_1,
        property.property_address_line_2,
        property.property_city,
        property.property_state,
        property.property_postal_code,
        property.county,
        property.parcel_number,
        property.property_type,
        property.property_status,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          value?.toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "all" ||
        property.property_status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        property.property_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Search and filters controls */}
      <section className="rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm shadow-sm transition-all duration-300">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by address, city, county, ZIP, or parcel number..."
            className="rounded-lg border border-[#EDE7DC] bg-[#FBF9F6]/80 px-4 py-3 text-sm text-[#5C544A] outline-none transition placeholder:text-[#8F8578]/60 focus:border-[#D8B66A]/60"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-[#EDE7DC] bg-[#FBF9F6]/80 px-4 py-3 text-sm text-[#5C544A] outline-none transition focus:border-[#D8B66A]/60"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-[#EDE7DC] bg-[#FBF9F6]/80 px-4 py-3 text-sm text-[#5C544A] outline-none transition focus:border-[#D8B66A]/60"
          >
            <option value="all">All Property Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
          Showing {filteredProperties.length} of {properties.length} properties
        </p>
      </section>

      {/* Table & Fallbacks */}
      {filteredProperties.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 px-6 py-16 text-center backdrop-blur-sm">
          <h2 className="font-serif text-2xl font-normal text-[#B7832F]">
            No properties match your filters
          </h2>
          <p className="mt-3 text-sm text-[#5C544A]">
            Try changing your search, status, or property-type filter.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#EDE7DC] bg-white/45 backdrop-blur-sm shadow-sm transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-[#EDE7DC] text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                  <th className="px-5 py-4 font-semibold">Property</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Details</th>
                  <th className="px-5 py-4 font-semibold">Estimated Value</th>
                  <th className="px-5 py-4 font-semibold">Asking Price</th>
                  <th className="px-5 py-4 font-semibold">Contacts</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EDE7DC]/60">
                {filteredProperties.map((property) => {
                  const linkedContactCount =
                    relationshipCounts.get(property.id) ?? 0;

                  return (
                    <tr
                      key={property.id}
                      className="transition-colors duration-200 hover:bg-white/60"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/properties/${property.id}`}
                          className="font-serif text-base font-normal text-[#B7832F] transition-colors hover:text-[#D8B66A]"
                        >
                          {property.property_address_line_1 ||
                            "Unnamed Property"}
                        </Link>
                        <p className="mt-1 text-sm text-[#5C544A]">
                          {formatCityStateZip(property)}
                        </p>
                        {property.parcel_number && (
                          <p className="mt-1 text-[11px] text-[#8F8578]">
                            Parcel: {property.parcel_number}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#5C544A]">
                        {property.property_type
                          ? formatLabel(property.property_type)
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={property.property_status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#7C7265]">
                        {formatPropertyDetails(property)}
                      </td>

                      <td className="px-5 py-4 font-serif text-[#B7832F]">
                        {formatCurrency(property.estimated_value)}
                      </td>

                      <td className="px-5 py-4 font-serif text-[#B7832F]">
                        {formatCurrency(property.asking_price)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-[#D8B66A]/40 bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#B7832F]">
                          {linkedContactCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-sm text-[#8F8578]">—</span>;
  }

  // Adjusted mappings to match RoseVault signature palette system
  const styles: Record<string, string> = {
    prospect: "border-[#D8CDBE] bg-white/60 text-[#7C7265]",
    active: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
    under_contract: "border-blue-200 bg-blue-50/70 text-blue-700",
    closed: "border-purple-200 bg-purple-50/70 text-purple-700",
    inactive: "border-[#E3DCD0] bg-[#F1ECE4]/70 text-[#7C7265]",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "border-[#D8CDBE] bg-white/60 text-[#7C7265]"
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

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCityStateZip(property: Property) {
  const cityState = [property.property_city, property.property_state]
    .filter(Boolean)
    .join(", ");

  return [cityState, property.property_postal_code].filter(Boolean).join(" ") || "—";
}

function formatPropertyDetails(property: Property) {
  const details: string[] = [];

  if (property.bedrooms !== null) {
    details.push(`${property.bedrooms} bd`);
  }

  if (property.bathrooms !== null) {
    details.push(`${property.bathrooms} ba`);
  }

  if (property.square_feet !== null) {
    details.push(
      `${new Intl.NumberFormat("en-US").format(property.square_feet)} sq ft`,
    );
  }

  return details.length > 0 ? details.join(" · ") : "—";
}