"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

type CsvRow = Record<string, string>;

type FieldDefinition = {
  value: string;
  label: string;
  category: "contact" | "mailing" | "property";
  aliases: string[];
};

type DuplicateMode = "skip" | "update" | "create";

type Props = {
  organizationId: string;
  userId: string;
};

type ImportResults = {
  contactsCreated: number;
  contactsUpdated: number;
  contactsSkipped: number;
  propertiesCreated: number;
  propertiesMatched: number;
  relationshipsCreated: number;
  failed: number;
};

const CONTACT_FIELDS: FieldDefinition[] = [
  {
    value: "first_name",
    label: "First Name",
    category: "contact",
    aliases: [
      "first name",
      "firstname",
      "first",
      "given name",
      "givenname",
      "owner first name",
    ],
  },
  {
    value: "last_name",
    label: "Last Name",
    category: "contact",
    aliases: [
      "last name",
      "lastname",
      "last",
      "surname",
      "family name",
      "owner last name",
    ],
  },
  {
    value: "email",
    label: "Email",
    category: "contact",
    aliases: [
      "email",
      "email address",
      "emailaddress",
      "e-mail",
      "owner email",
    ],
  },
  {
    value: "cell_phone",
    label: "Cell Phone",
    category: "contact",
    aliases: [
      "cell phone",
      "cell",
      "mobile",
      "mobile phone",
      "cellphone",
      "phone",
      "phone number",
      "owner phone",
    ],
  },
  {
    value: "business_phone",
    label: "Business Phone",
    category: "contact",
    aliases: [
      "business phone",
      "work phone",
      "office phone",
      "businessphone",
    ],
  },
  {
    value: "contact_type",
    label: "Contact Type",
    category: "contact",
    aliases: ["contact type", "type", "contacttype", "category"],
  },
  {
    value: "status",
    label: "Status",
    category: "contact",
    aliases: ["status", "contact status"],
  },
  {
    value: "lead_source",
    label: "Lead Source",
    category: "contact",
    aliases: ["lead source", "source", "leadsource", "origin"],
  },
  {
    value: "preferred_contact_method",
    label: "Preferred Contact Method",
    category: "contact",
    aliases: [
      "preferred contact method",
      "contact preference",
      "preferred method",
    ],
  },
  {
    value: "company",
    label: "Company",
    category: "contact",
    aliases: [
      "company",
      "company name",
      "organization",
      "business",
    ],
  },
  {
    value: "job_title",
    label: "Job Title",
    category: "contact",
    aliases: ["job title", "title", "position", "jobtitle"],
  },
  {
    value: "spouse_first_name",
    label: "Spouse First Name",
    category: "contact",
    aliases: [
      "spouse first name",
      "spouse firstname",
      "spouse first",
    ],
  },
  {
    value: "spouse_last_name",
    label: "Spouse Last Name",
    category: "contact",
    aliases: [
      "spouse last name",
      "spouse lastname",
      "spouse last",
    ],
  },
  {
    value: "spouse_email",
    label: "Spouse Email",
    category: "contact",
    aliases: ["spouse email", "spouse email address"],
  },
  {
    value: "spouse_cell_phone",
    label: "Spouse Cell Phone",
    category: "contact",
    aliases: [
      "spouse cell phone",
      "spouse mobile",
      "spouse phone",
    ],
  },
  {
    value: "spouse_business_phone",
    label: "Spouse Business Phone",
    category: "contact",
    aliases: [
      "spouse business phone",
      "spouse work phone",
      "spouse office phone",
    ],
  },
  {
    value: "notes",
    label: "Contact Notes",
    category: "contact",
    aliases: ["notes", "contact notes", "owner notes", "comments"],
  },

  // Mailing address
  {
    value: "mailing_address_line_1",
    label: "Mailing Address Line 1",
    category: "mailing",
    aliases: [
      "mailing address",
      "mailing street address",
      "mailing address 1",
      "mailing address line 1",
      "owner mailing address",
      "owner address",
    ],
  },
  {
    value: "mailing_address_line_2",
    label: "Mailing Address Line 2",
    category: "mailing",
    aliases: [
      "mailing address 2",
      "mailing address line 2",
      "mailing suite",
      "mailing unit",
      "mailing apartment",
    ],
  },
  {
    value: "mailing_city",
    label: "Mailing City",
    category: "mailing",
    aliases: ["mailing city", "owner city"],
  },
  {
    value: "mailing_state",
    label: "Mailing State",
    category: "mailing",
    aliases: ["mailing state", "owner state"],
  },
  {
    value: "mailing_postal_code",
    label: "Mailing ZIP / Postal Code",
    category: "mailing",
    aliases: [
      "mailing zip",
      "mailing zip code",
      "mailing zipcode",
      "mailing postal code",
      "owner zip",
    ],
  },

  // Property fields
  {
    value: "property_address_line_1",
    label: "Property Address Line 1",
    category: "property",
    aliases: [
      "property address",
      "property street address",
      "property address 1",
      "property address line 1",
      "site address",
      "situs address",
    ],
  },
  {
    value: "property_address_line_2",
    label: "Property Address Line 2",
    category: "property",
    aliases: [
      "property address 2",
      "property address line 2",
      "property unit",
      "property suite",
    ],
  },
  {
    value: "property_city",
    label: "Property City",
    category: "property",
    aliases: ["property city", "site city", "situs city"],
  },
  {
    value: "property_state",
    label: "Property State",
    category: "property",
    aliases: ["property state", "site state", "situs state"],
  },
  {
    value: "property_postal_code",
    label: "Property ZIP / Postal Code",
    category: "property",
    aliases: [
      "property zip",
      "property zip code",
      "property zipcode",
      "property postal code",
      "site zip",
      "situs zip",
    ],
  },
  {
    value: "county",
    label: "Property County",
    category: "property",
    aliases: [
      "county",
      "property county",
      "site county",
      "situs county",
    ],
  },
  {
    value: "parcel_number",
    label: "Parcel Number",
    category: "property",
    aliases: [
      "parcel number",
      "parcel",
      "apn",
      "parcel id",
      "tax parcel number",
    ],
  },
  {
    value: "property_type",
    label: "Property Type",
    category: "property",
    aliases: [
      "property type",
      "asset type",
      "building type",
    ],
  },
  {
    value: "bedrooms",
    label: "Bedrooms",
    category: "property",
    aliases: ["bedrooms", "beds", "bedroom count"],
  },
  {
    value: "bathrooms",
    label: "Bathrooms",
    category: "property",
    aliases: ["bathrooms", "baths", "bathroom count"],
  },
  {
    value: "square_feet",
    label: "Square Feet",
    category: "property",
    aliases: [
      "square feet",
      "sq ft",
      "sqft",
      "living area",
      "building area",
    ],
  },
  {
    value: "year_built",
    label: "Year Built",
    category: "property",
    aliases: ["year built", "yearbuilt", "built year"],
  },
  {
    value: "estimated_value",
    label: "Estimated Value",
    category: "property",
    aliases: [
      "estimated value",
      "property value",
      "market value",
      "estimated market value",
    ],
  },
  {
    value: "asking_price",
    label: "Asking Price",
    category: "property",
    aliases: ["asking price", "list price", "price"],
  },
  {
    value: "mortgage_balance",
    label: "Mortgage Balance",
    category: "property",
    aliases: [
      "mortgage balance",
      "loan balance",
      "estimated mortgage balance",
    ],
  },
  {
    value: "property_notes",
    label: "Property Notes",
    category: "property",
    aliases: [
      "property notes",
      "property comments",
      "asset notes",
    ],
  },
];

const CONTACT_FIELD_NAMES = new Set(
  CONTACT_FIELDS.filter(
    (field) =>
      field.category === "contact" || field.category === "mailing"
  ).map((field) => field.value)
);

const PROPERTY_FIELD_NAMES = new Set(
  CONTACT_FIELDS.filter((field) => field.category === "property").map(
    (field) => field.value
  )
);

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function detectField(header: string) {
  const normalizedHeader = normalizeHeader(header);

  const match = CONTACT_FIELDS.find((field) =>
    field.aliases.some(
      (alias) => normalizeHeader(alias) === normalizedHeader
    )
  );

  return match?.value ?? "";
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") || "";
  return digits || null;
}

function normalizeAddress(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") || "";
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;

  const cleaned = value.replace(/[$,\s]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | null | undefined) {
  const parsed = parseNumber(value);

  if (parsed === null) return null;

  return Math.round(parsed);
}

function normalizeContactType(value: string | null | undefined) {
  const allowedTypes = [
    "lead",
    "buyer",
    "seller",
    "investor",
    "agent",
    "lender",
    "attorney",
    "contractor",
    "vendor",
    "tenant",
    "landlord",
    "other",
  ];

  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return normalized && allowedTypes.includes(normalized)
    ? normalized
    : "lead";
}

function normalizeStatus(value: string | null | undefined) {
  const allowedStatuses = [
    "active",
    "new",
    "nurture",
    "inactive",
    "past_client",
    "do_not_contact",
  ];

  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return normalized && allowedStatuses.includes(normalized)
    ? normalized
    : "active";
}

export default function ContactImporter({
  organizationId,
  userId,
}: Props) {
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [duplicateMode, setDuplicateMode] =
    useState<DuplicateMode>("skip");

  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<ImportResults | null>(null);

  const mappedFields = useMemo(
    () =>
      Object.entries(mapping).filter(
        ([, destination]) => destination
      ),
    [mapping]
  );

  const hasFirstNameMapping = mappedFields.some(
    ([, destination]) => destination === "first_name"
  );

  const hasPropertyAddressMapping = mappedFields.some(
    ([, destination]) =>
      destination === "property_address_line_1"
  );

  function resetImporter() {
    setFileName("");
    setRows([]);
    setHeaders([]);
    setMapping({});
    setMessage("");
    setResults(null);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setResults(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please select a CSV file.");
      event.target.value = "";
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),

      complete: (result) => {
        const parsedRows = result.data.filter((row) =>
          Object.values(row).some((value) => value?.trim())
        );

        const parsedHeaders =
          result.meta.fields?.filter(Boolean) ?? [];

        if (
          parsedHeaders.length === 0 ||
          parsedRows.length === 0
        ) {
          setMessage(
            "This CSV does not contain any usable rows."
          );
          return;
        }

        const automaticMapping: Record<string, string> = {};

        parsedHeaders.forEach((header) => {
          automaticMapping[header] = detectField(header);
        });

        setFileName(file.name);
        setRows(parsedRows);
        setHeaders(parsedHeaders);
        setMapping(automaticMapping);
      },

      error: (error) => {
        setMessage(error.message);
      },
    });
  }

  function updateMapping(
    sourceHeader: string,
    destinationField: string
  ) {
    setMapping((current) => ({
      ...current,
      [sourceHeader]: destinationField,
    }));
  }

  function mapRow(row: CsvRow) {
    const mapped: Record<string, string | null> = {};

    for (const [sourceHeader, destinationField] of mappedFields) {
      if (!destinationField) continue;

      mapped[destinationField] =
        row[sourceHeader]?.trim() || null;
    }

    return mapped;
  }

  function buildContact(mapped: Record<string, string | null>) {
    return {
      organization_id: organizationId,
      created_by: userId,

      first_name: mapped.first_name?.trim() || "",
      last_name: mapped.last_name?.trim() || null,

      email: normalizeEmail(mapped.email),
      cell_phone: mapped.cell_phone?.trim() || null,
      business_phone: mapped.business_phone?.trim() || null,

      contact_type: normalizeContactType(mapped.contact_type),
      status: normalizeStatus(mapped.status),

      lead_source: mapped.lead_source?.trim() || null,

      preferred_contact_method:
        mapped.preferred_contact_method?.trim() || null,

      company: mapped.company?.trim() || null,
      job_title: mapped.job_title?.trim() || null,

      spouse_first_name:
        mapped.spouse_first_name?.trim() || null,

      spouse_last_name:
        mapped.spouse_last_name?.trim() || null,

      spouse_email: normalizeEmail(mapped.spouse_email),

      spouse_cell_phone:
        mapped.spouse_cell_phone?.trim() || null,

      spouse_business_phone:
        mapped.spouse_business_phone?.trim() || null,

      mailing_address_line_1:
        mapped.mailing_address_line_1?.trim() || null,

      mailing_address_line_2:
        mapped.mailing_address_line_2?.trim() || null,

      mailing_city: mapped.mailing_city?.trim() || null,
      mailing_state: mapped.mailing_state?.trim() || null,

      mailing_postal_code:
        mapped.mailing_postal_code?.trim() || null,

      notes: mapped.notes?.trim() || null,
    };
  }

  function buildProperty(mapped: Record<string, string | null>) {
    return {
      organization_id: organizationId,
      created_by: userId,

      property_address_line_1:
        mapped.property_address_line_1?.trim() || "",

      property_address_line_2:
        mapped.property_address_line_2?.trim() || null,

      property_city:
        mapped.property_city?.trim() || null,

      property_state:
        mapped.property_state?.trim() || null,

      property_postal_code:
        mapped.property_postal_code?.trim() || null,

      county: mapped.county?.trim() || null,

      parcel_number:
        mapped.parcel_number?.trim() || null,

      property_type:
        mapped.property_type?.trim() || null,

      bedrooms: parseNumber(mapped.bedrooms),
      bathrooms: parseNumber(mapped.bathrooms),
      square_feet: parseInteger(mapped.square_feet),
      year_built: parseInteger(mapped.year_built),

      estimated_value: parseNumber(mapped.estimated_value),
      asking_price: parseNumber(mapped.asking_price),

      mortgage_balance:
        parseNumber(mapped.mortgage_balance),

      notes: mapped.property_notes?.trim() || null,

      property_status: "prospect",
    };
  }

  async function handleImport() {
    setMessage("");
    setResults(null);

    if (!hasFirstNameMapping) {
      setMessage(
        "Please map one CSV column to First Name before importing."
      );
      return;
    }

    setIsImporting(true);

    const supabase = createClient();

    const [
      { data: existingContacts, error: contactsError },
      { data: existingProperties, error: propertiesError },
    ] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, email, cell_phone")
        .eq("organization_id", organizationId),

      supabase
        .from("properties")
        .select(`
          id,
          property_address_line_1,
          property_city,
          property_state,
          property_postal_code,
          parcel_number
        `)
        .eq("organization_id", organizationId),
    ]);

    if (contactsError || propertiesError) {
      setMessage(
        contactsError?.message ||
          propertiesError?.message ||
          "Unable to load existing records."
      );
      setIsImporting(false);
      return;
    }

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let contactsSkipped = 0;
    let propertiesCreated = 0;
    let propertiesMatched = 0;
    let relationshipsCreated = 0;
    let failed = 0;

    for (const row of rows) {
      const mapped = mapRow(row);

      const contactFieldsExist = Object.keys(mapped).some(
        (key) =>
          CONTACT_FIELD_NAMES.has(key) &&
          Boolean(mapped[key]?.trim())
      );

      if (!contactFieldsExist || !mapped.first_name?.trim()) {
        failed++;
        continue;
      }

      const contact = buildContact(mapped);

      const contactEmail = normalizeEmail(contact.email);
      const contactPhone = normalizePhone(contact.cell_phone);

      const duplicateContact = existingContacts?.find(
        (existing) => {
          const emailMatches =
            Boolean(contactEmail) &&
            normalizeEmail(existing.email) === contactEmail;

          const phoneMatches =
            Boolean(contactPhone) &&
            normalizePhone(existing.cell_phone) === contactPhone;

          return emailMatches || phoneMatches;
        }
      );

      let contactId: string | null = null;

      if (duplicateContact && duplicateMode === "skip") {
        contactId = duplicateContact.id;
        contactsSkipped++;
      } else if (
        duplicateContact &&
        duplicateMode === "update"
      ) {
        const { error } = await supabase
          .from("contacts")
          .update(contact)
          .eq("id", duplicateContact.id)
          .eq("organization_id", organizationId);

        if (error) {
          failed++;
          continue;
        }

        contactId = duplicateContact.id;
        contactsUpdated++;
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .insert(contact)
          .select("id")
          .single();

        if (error || !data) {
          failed++;
          continue;
        }

        contactId = data.id;
        contactsCreated++;

        existingContacts?.push({
          id: data.id,
          email: contact.email,
          cell_phone: contact.cell_phone,
        });
      }

      const hasPropertyData = Object.keys(mapped).some(
        (key) =>
          PROPERTY_FIELD_NAMES.has(key) &&
          Boolean(mapped[key]?.trim())
      );

      if (
        !hasPropertyData ||
        !mapped.property_address_line_1?.trim()
      ) {
        continue;
      }

      const property = buildProperty(mapped);

      const normalizedPropertyAddress = normalizeAddress(
        property.property_address_line_1
      );

      const normalizedCity = normalizeAddress(
        property.property_city
      );

      const normalizedState = normalizeAddress(
        property.property_state
      );

      const normalizedPostalCode = normalizeAddress(
        property.property_postal_code
      );

      const parcelNumber =
        property.parcel_number?.trim().toLowerCase() || "";

      const duplicateProperty = existingProperties?.find(
        (existing) => {
          const parcelMatches =
            Boolean(parcelNumber) &&
            existing.parcel_number
              ?.trim()
              .toLowerCase() === parcelNumber;

          const addressMatches =
            normalizeAddress(
              existing.property_address_line_1
            ) === normalizedPropertyAddress &&
            normalizeAddress(existing.property_city) ===
              normalizedCity &&
            normalizeAddress(existing.property_state) ===
              normalizedState &&
            normalizeAddress(
              existing.property_postal_code
            ) === normalizedPostalCode;

          return parcelMatches || addressMatches;
        }
      );

      let propertyId: string | null = null;

      if (duplicateProperty) {
        propertyId = duplicateProperty.id;
        propertiesMatched++;
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert(property)
          .select("id")
          .single();

        if (error || !data) {
          failed++;
          continue;
        }

        propertyId = data.id;
        propertiesCreated++;

        existingProperties?.push({
          id: data.id,
          property_address_line_1:
            property.property_address_line_1,
          property_city: property.property_city,
          property_state: property.property_state,
          property_postal_code:
            property.property_postal_code,
          parcel_number: property.parcel_number,
        });
      }

      if (contactId && propertyId) {
        const { error: relationshipError } = await supabase
          .from("contact_property_relationships")
          .upsert(
            {
              organization_id: organizationId,
              contact_id: contactId,
              property_id: propertyId,
              relationship_type: "owner",
              is_primary: true,
            },
            {
              onConflict:
                "contact_id,property_id,relationship_type",
              ignoreDuplicates: true,
            }
          );

        if (relationshipError) {
          failed++;
        } else {
          relationshipsCreated++;
        }
      }
    }

    setResults({
      contactsCreated,
      contactsUpdated,
      contactsSkipped,
      propertiesCreated,
      propertiesMatched,
      relationshipsCreated,
      failed,
    });

    setIsImporting(false);
    router.refresh();
  }

  const inputClasses =
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d4af37]";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
          Step 1
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Upload CSV File
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Import contacts, mailing addresses, properties, or all of
          them together in one CSV file.
        </p>

        <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#444444] bg-[#111111] px-6 text-center transition hover:border-[#d4af37]">
          <span className="text-lg font-medium text-white">
            {fileName || "Choose a CSV file"}
          </span>

          <span className="mt-2 text-sm text-gray-500">
            Click to browse your computer
          </span>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {rows.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {rows.length} rows detected
            </p>

            <button
              type="button"
              onClick={resetImporter}
              className="text-sm text-gray-500 transition hover:text-[#d4af37]"
            >
              Choose another file
            </button>
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            Step 2
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Map Your Fields
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            RoseVault automatically suggests mappings. Review each
            column before importing.
          </p>

          <div className="mt-6 space-y-3">
            {headers.map((header) => (
              <div
                key={header}
                className="grid grid-cols-1 items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 md:grid-cols-[1fr_auto_1fr]"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    CSV Column
                  </p>

                  <p className="mt-1 font-medium text-white">
                    {header}
                  </p>
                </div>

                <span className="hidden text-gray-600 md:block">
                  →
                </span>

                <select
                  value={mapping[header] ?? ""}
                  onChange={(event) =>
                    updateMapping(header, event.target.value)
                  }
                  className={inputClasses}
                >
                  <option value="">Do not import</option>

                  <optgroup label="Contact Information">
                    {CONTACT_FIELDS.filter(
                      (field) => field.category === "contact"
                    ).map((field) => (
                      <option
                        key={field.value}
                        value={field.value}
                      >
                        {field.label}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Mailing Address">
                    {CONTACT_FIELDS.filter(
                      (field) => field.category === "mailing"
                    ).map((field) => (
                      <option
                        key={field.value}
                        value={field.value}
                      >
                        {field.label}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Property Information">
                    {CONTACT_FIELDS.filter(
                      (field) => field.category === "property"
                    ).map((field) => (
                      <option
                        key={field.value}
                        value={field.value}
                      >
                        {field.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#151515]">
          <div className="border-b border-[#2a2a2a] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              Step 3
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Preview
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Review the first five rows before importing.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111111]">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-5 py-4 font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2a2a2a]">
                {rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="max-w-xs truncate whitespace-nowrap px-5 py-4 text-sm text-gray-400"
                      >
                        {row[header] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            Step 4
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Handle Contact Duplicates
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            RoseVault checks existing contacts by email address or
            cell phone. Properties are matched by parcel number or
            property address.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <DuplicateOption
              title="Skip Duplicates"
              description="Keep the existing contact unchanged, but still connect any property from the imported row."
              selected={duplicateMode === "skip"}
              onClick={() => setDuplicateMode("skip")}
            />

            <DuplicateOption
              title="Update Existing"
              description="Update matching contacts with imported values and connect their properties."
              selected={duplicateMode === "update"}
              onClick={() => setDuplicateMode("update")}
            />

            <DuplicateOption
              title="Create Anyway"
              description="Create a new contact even when the email or cell phone matches an existing contact."
              selected={duplicateMode === "create"}
              onClick={() => setDuplicateMode("create")}
            />
          </div>
        </section>
      )}

      {message && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {message}
        </div>
      )}

      {results && (
        <section className="rounded-2xl border border-[#d4af37]/30 bg-[#151515] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            Import Complete
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            RoseVault finished processing your data.
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ResultCard
              label="Contacts Created"
              value={results.contactsCreated}
            />

            <ResultCard
              label="Contacts Updated"
              value={results.contactsUpdated}
            />

            <ResultCard
              label="Contacts Skipped"
              value={results.contactsSkipped}
            />

            <ResultCard
              label="Properties Created"
              value={results.propertiesCreated}
            />

            <ResultCard
              label="Properties Matched"
              value={results.propertiesMatched}
            />

            <ResultCard
              label="Property Links"
              value={results.relationshipsCreated}
            />

            <ResultCard
              label="Failed"
              value={results.failed}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contacts"
              className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
            >
              View Contacts
            </Link>

            <button
              type="button"
              onClick={resetImporter}
              className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Import Another File
            </button>
          </div>
        </section>
      )}

      {rows.length > 0 && !results && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !hasFirstNameMapping}
            className="rounded-lg bg-[#d4af37] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting
              ? "Importing Data..."
              : hasPropertyAddressMapping
                ? `Import ${rows.length} Contacts & Properties`
                : `Import ${rows.length} Contacts`}
          </button>
        </div>
      )}
    </div>
  );
}

function DuplicateOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition ${
        selected
          ? "border-[#d4af37] bg-[#d4af37]/10"
          : "border-[#333333] bg-[#111111] hover:border-[#d4af37]/50"
      }`}
    >
      <p
        className={
          selected
            ? "font-semibold text-[#d4af37]"
            : "font-semibold text-white"
        }
      >
        {selected ? "✓ " : ""}
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </button>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-2 text-3xl font-semibold text-[#d4af37]">
        {value}
      </p>
    </div>
  );
}