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
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0D0C0A] disabled:hover:text-[#D8B66A] disabled:hover:shadow-none";

  return (
    <div className="space-y-6">
      {/* Step 1 — Upload */}
      <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Step 01 · Data Source
          </p>

          <h2 className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
            Upload CSV File
          </h2>

          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#7C7265]">
            Import contacts, mailing addresses, properties, or all of them
            together in one CSV file.
          </p>
        </div>

        <label className="group mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D8CDBE] bg-white/45 px-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/70 hover:bg-[#B7832F]/5 hover:shadow-sm">
          <span className="font-serif text-lg font-normal tracking-wide text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
            {fileName || "Choose a CSV file"}
          </span>

          <span className="mt-2 text-xs tracking-wide text-[#8F8578]">
            Click to browse your computer
          </span>

          <span className="mt-4 rounded-full border border-[#E3DCD0] bg-white/70 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D] transition-all duration-300 group-hover:border-[#D8B66A]/40 group-hover:text-[#B7832F]">
            CSV Files Only
          </span>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {rows.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#EDE7DC] bg-white/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#29231D]">
                {rows.length} row{rows.length === 1 ? "" : "s"} detected
              </p>

              <p className="mt-1 text-[10px] text-[#A89C8D]">
                {fileName}
              </p>
            </div>

            <button
              type="button"
              onClick={resetImporter}
              className="cursor-pointer text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578] transition-colors duration-300 hover:text-[#B7832F] sm:text-right"
            >
              Choose Another File
            </button>
          </div>
        )}
      </section>

      {/* Step 2 — Field Mapping */}
      {rows.length > 0 && (
        <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Step 02 · Field Intelligence
            </p>

            <h2 className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
              Map Your Fields
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#7C7265]">
              RoseVault automatically suggests mappings based on your CSV
              headers. Review each column before importing.
            </p>
          </div>

          <div className="space-y-3">
            {headers.map((header) => {
              const isMapped = Boolean(mapping[header]);

              return (
                <div
                  key={header}
                  className="group grid grid-cols-1 items-center gap-4 rounded-xl border border-[#EDE7DC] bg-white/45 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/70 hover:shadow-sm md:grid-cols-[1fr_auto_1fr]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                        CSV Column
                      </p>

                      {isMapped && (
                        <span className="rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
                          Mapped
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 truncate font-serif text-sm font-medium tracking-wide text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
                      {header}
                    </p>
                  </div>

                  <span className="hidden text-sm text-[#C4B8A8] transition-colors duration-300 group-hover:text-[#D8B66A] md:block">
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
                        (field) => field.category === "contact",
                      ).map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Mailing Address">
                      {CONTACT_FIELDS.filter(
                        (field) => field.category === "mailing",
                      ).map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Property Information">
                      {CONTACT_FIELDS.filter(
                        (field) => field.category === "property",
                      ).map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 3 — Preview */}
      {rows.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-[#EDE7DC] bg-white/40 backdrop-blur-sm">
          <div className="border-b border-[#EDE7DC] p-6 lg:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Step 03 · Data Preview
            </p>

            <h2 className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
              Preview
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
              Review the first five rows before importing them into RoseVault.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#E3DCD0] bg-[#F5EEDF]/55">
                <tr className="text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-5 py-4 font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EDE7DC]/80">
                {rows.slice(0, 5).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="transition-colors duration-300 hover:bg-white/65"
                  >
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="max-w-xs truncate whitespace-nowrap px-5 py-4 text-xs text-[#7C7265]"
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

      {/* Step 4 — Duplicate Handling */}
      {rows.length > 0 && (
        <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Step 04 · Record Protection
            </p>

            <h2 className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
              Handle Contact Duplicates
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#7C7265]">
              RoseVault checks existing contacts by email address or cell phone.
              Properties are matched by parcel number or property address.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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

      {/* Error Message */}
      {message && (
        <div className="rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700">
          {message}
        </div>
      )}

      {/* Import Results */}
      {results && (
        <section className="rounded-xl border border-[#D8B66A]/35 bg-white/50 p-6 backdrop-blur-sm lg:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Import Complete
            </p>

            <h2 className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
              RoseVault finished processing your data.
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
              Review the import summary below to see exactly what was created,
              updated, matched, skipped, or unable to process.
            </p>
          </div>

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

            <ResultCard label="Failed" value={results.failed} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-[#EDE7DC]/80 pt-6">
            <Link href="/contacts" className={primaryButtonClasses}>
              View Contacts
            </Link>

            <button
              type="button"
              onClick={resetImporter}
              className={secondaryButtonClasses}
            >
              Import Another File
            </button>
          </div>
        </section>
      )}

      {/* Primary Import Action */}
      {rows.length > 0 && !results && (
        <div className="flex flex-col items-end gap-3 border-t border-[#EDE7DC]/70 pt-6">
          {!hasFirstNameMapping && (
            <p className="text-xs text-amber-700">
              Map one CSV column to First Name to enable importing.
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !hasFirstNameMapping}
            className={`${primaryButtonClasses} px-7`}
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
      aria-pressed={selected}
      className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-300 ${
        selected
          ? "border-[#D8B66A]/60 bg-[#B7832F]/10 shadow-sm"
          : "border-[#EDE7DC] bg-white/50 hover:-translate-y-0.5 hover:border-[#D8B66A]/50 hover:bg-[#B7832F]/5 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`font-serif text-sm font-medium tracking-wide transition-colors duration-300 ${
            selected
              ? "text-[#916520]"
              : "text-[#29231D] group-hover:text-[#B7832F]"
          }`}
        >
          {title}
        </p>

        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-all duration-300 ${
            selected
              ? "border-[#D8B66A] bg-[#B7832F] text-white"
              : "border-[#D8CDBE] bg-white/60 text-transparent group-hover:border-[#D8B66A]"
          }`}
        >
          ✓
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
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
    <div className="group rounded-xl border border-[#EDE7DC] bg-white/55 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/80 hover:shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8F8578]">
        {label}
      </p>

      <p className="mt-3 font-serif text-3xl font-normal text-[#B7832F]">
        {value}
      </p>
    </div>
  );
}