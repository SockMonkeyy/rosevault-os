"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PropertyOption = {
  id: string;
  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
  property_status: string | null;
};

type FormState = {
  transaction_name: string;
  property_id: string;
  transaction_type: string;
  status: string;
  purchase_price: string;
  sale_price: string;
  assignment_fee: string;
  earnest_money: string;
  contract_date: string;
  inspection_deadline: string;
  financing_deadline: string;
  closing_date: string;
  actual_closing_date: string;
  title_company: string;
  closing_attorney: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  transaction_name: "",
  property_id: "",
  transaction_type: "purchase",
  status: "draft",
  purchase_price: "",
  sale_price: "",
  assignment_fee: "",
  earnest_money: "",
  contract_date: "",
  inspection_deadline: "",
  financing_deadline: "",
  closing_date: "",
  actual_closing_date: "",
  title_company: "",
  closing_attorney: "",
  notes: "",
};

const TRANSACTION_TYPES = [
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
  { value: "wholesale_assignment", label: "Wholesale Assignment" },
  { value: "double_close", label: "Double Close" },
  { value: "subject_to", label: "Subject-To" },
  { value: "seller_finance", label: "Seller Finance" },
  { value: "lease", label: "Lease" },
  { value: "other", label: "Other" },
];

const TRANSACTION_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "lead", label: "Lead / Opportunity" },
  { value: "offer_made", label: "Offer Made" },
  { value: "under_contract", label: "Under Contract" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "clear_to_close", label: "Clear to Close" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "terminated", label: "Terminated" },
  { value: "lost", label: "Lost" },
];

export default function NewTransactionPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("Authenticated User:", user?.id);

        if (userError) {
          setLoadError(`Unable to verify user: ${userError.message}`);
          setIsLoading(false);
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);

        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) {
          setLoadError(
            `Unable to load organization membership: ${membershipError.message}`,
          );
          setIsLoading(false);
          return;
        }

        if (!membership) {
          router.replace("/onboarding");
          return;
        }

        setOrganizationId(membership.organization_id);

        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select(
            `
            id,
            property_address_line_1,
            property_address_line_2,
            property_city,
            property_state,
            property_postal_code,
            property_status
          `,
          )
          .eq("organization_id", membership.organization_id)
          .order("property_address_line_1", { ascending: true });

        if (propertiesError) {
          setLoadError(`Unable to load properties: ${propertiesError.message}`);
          setIsLoading(false);
          return;
        }

        setProperties(propertiesData ?? []);
        setIsLoading(false);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? `Unable to load transaction form: ${error.message}`
            : "An unexpected error occurred while loading the transaction form.",
        );

        setIsLoading(false);
      }
    }

    loadPageData();
  }, [router]);

  const selectedProperty = useMemo(
    () =>
      properties.find((property) => property.id === form.property_id) ?? null,
    [properties, form.property_id],
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (saveError) {
      setSaveError("");
    }
  }

  function usePropertyAddressAsName() {
    if (!selectedProperty) {
      return;
    }

    const propertyName =
      selectedProperty.property_address_line_1 || "Property Transaction";

    updateField("transaction_name", propertyName);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !userId) {
      setSaveError(
        "Your organization or user information is not available. Refresh the page and try again.",
      );
      return;
    }

    if (!form.transaction_name.trim()) {
      setSaveError("Transaction name is required.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const supabase = createClient();

      const payload = {
        organization_id: organizationId,
        property_id: form.property_id || null,
        transaction_name: form.transaction_name.trim(),
        transaction_type: form.transaction_type,
        status: form.status,

        purchase_price: parseOptionalNumber(form.purchase_price),
        sale_price: parseOptionalNumber(form.sale_price),
        assignment_fee: parseOptionalNumber(form.assignment_fee),
        earnest_money: parseOptionalNumber(form.earnest_money),

        contract_date: form.contract_date || null,
        inspection_deadline: form.inspection_deadline || null,
        financing_deadline: form.financing_deadline || null,
        closing_date: form.closing_date || null,
        actual_closing_date: form.actual_closing_date || null,

        title_company: form.title_company.trim() || null,
        closing_attorney: form.closing_attorney.trim() || null,
        notes: form.notes.trim() || null,

        created_by: userId,
      };

      console.log("Organization ID:", organizationId);
      console.log("User ID:", userId);
      console.log("Payload:", payload);

      const { data: membershipCheck, error: membershipCheckError } =
        await supabase
          .from("organization_members")
          .select("*")
          .eq("user_id", userId)
          .eq("organization_id", organizationId);

      console.log("Membership Check:", membershipCheck);
      console.log("Membership Error:", membershipCheckError);

      const result = await supabase.from("transactions").insert(payload);

      console.log("Insert Result:", result);

      const { data, error, status, statusText } = result;

      console.log({
        data,
        error,
        status,
        statusText,
      });

      if (error) {
        setSaveError(`Unable to create transaction: ${error.message}`);
        setIsSaving(false);
        return;
      }

      router.replace("/transactions");
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? `Unable to create transaction: ${error.message}`
          : "An unexpected error occurred while creating the transaction.",
      );

      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex min-h-96 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#151515]">
            <p className="text-sm text-gray-500">Loading transaction form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/transactions"
            className="mb-5 inline-block text-sm text-[#d4af37] hover:underline"
          >
            ← Back to Transactions
          </Link>

          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-red-300">
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/transactions"
            className="mb-4 inline-block text-sm font-medium text-[#B7832F] transition hover:text-[#94651F] hover:underline"
          >
            ← Back to Transactions
          </Link>

          <h1 className="text-3xl font-semibold text-[#29231D]">
            New Transaction
          </h1>

          <p className="mt-2 max-w-2xl text-[#756A5C]">
            Create a new deal workspace to track the property, financials,
            contract dates, deadlines, closing information, and notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Basics */}
          <FormSection
            title="Transaction Basics"
            description="Name the transaction, connect a property, and define the deal type and current status."
          >
            <FormField label="Transaction Name" required>
              <input
                type="text"
                value={form.transaction_name}
                onChange={(event) =>
                  updateField("transaction_name", event.target.value)
                }
                placeholder="Example: 521 Winterpark Cir Purchase"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Linked Property">
              <select
                value={form.property_id}
                onChange={(event) =>
                  updateField("property_id", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">No property linked</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {formatPropertyOption(property)}
                  </option>
                ))}
              </select>

              {selectedProperty && (
                <button
                  type="button"
                  onClick={usePropertyAddressAsName}
                  className="mt-2 text-xs font-medium text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
                >
                  Use property address as transaction name
                </button>
              )}
            </FormField>

            <FormField label="Transaction Type" required>
              <select
                value={form.transaction_type}
                onChange={(event) =>
                  updateField("transaction_type", event.target.value)
                }
                className={inputClassName}
              >
                {TRANSACTION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status" required>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className={inputClassName}
              >
                {TRANSACTION_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </FormSection>

          {/* Financial Information */}
          <FormSection
            title="Financial Information"
            description="Track the major financial figures associated with this transaction."
          >
            <CurrencyField
              label="Purchase Price"
              value={form.purchase_price}
              onChange={(value) => updateField("purchase_price", value)}
              placeholder="250000"
            />

            <CurrencyField
              label="Sale Price"
              value={form.sale_price}
              onChange={(value) => updateField("sale_price", value)}
              placeholder="325000"
            />

            <CurrencyField
              label="Assignment Fee"
              value={form.assignment_fee}
              onChange={(value) => updateField("assignment_fee", value)}
              placeholder="15000"
            />

            <CurrencyField
              label="Earnest Money"
              value={form.earnest_money}
              onChange={(value) => updateField("earnest_money", value)}
              placeholder="1000"
            />
          </FormSection>

          {/* Important Dates */}
          <FormSection
            title="Important Dates"
            description="Track contract milestones, deadlines, and closing dates."
          >
            <FormField label="Contract Date">
              <input
                type="date"
                value={form.contract_date}
                onChange={(event) =>
                  updateField("contract_date", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Inspection Deadline">
              <input
                type="date"
                value={form.inspection_deadline}
                onChange={(event) =>
                  updateField("inspection_deadline", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Financing Deadline">
              <input
                type="date"
                value={form.financing_deadline}
                onChange={(event) =>
                  updateField("financing_deadline", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Projected Closing Date">
              <input
                type="date"
                value={form.closing_date}
                onChange={(event) =>
                  updateField("closing_date", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Actual Closing Date">
              <input
                type="date"
                value={form.actual_closing_date}
                onChange={(event) =>
                  updateField("actual_closing_date", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>
          </FormSection>

          {/* Closing Information */}
          <FormSection
            title="Closing Information"
            description="Record the title company and closing attorney associated with the deal."
          >
            <FormField label="Title Company">
              <input
                type="text"
                value={form.title_company}
                onChange={(event) =>
                  updateField("title_company", event.target.value)
                }
                placeholder="Title company name"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Closing Attorney">
              <input
                type="text"
                value={form.closing_attorney}
                onChange={(event) =>
                  updateField("closing_attorney", event.target.value)
                }
                placeholder="Attorney name or law firm"
                className={inputClassName}
              />
            </FormField>
          </FormSection>

          {/* Notes */}
          <section className="rounded-2xl border border-[#EADCC5] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#29231D]">Notes</h2>

              <p className="mt-1 text-sm text-[#756A5C]">
                Add deal context, seller details, repair information,
                negotiation notes, or anything else important.
              </p>
            </div>

            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={7}
              placeholder="Add transaction notes..."
              className={`${inputClassName} resize-y`}
            />
          </section>

          {/* Save error */}
          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EADCC5] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/transactions"
              className="rounded-lg border border-[#B7832F] bg-white px-6 py-3 text-center text-sm font-medium text-[#B7832F] transition hover:bg-[#F5EEDF]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#B7832F] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#94651F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creating Transaction..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-[#EADCC5] bg-white px-4 py-3 text-[#29231D] outline-none transition placeholder:text-[#A89C8D] focus:border-[#B7832F] focus:ring-2 focus:ring-[#B7832F]/10";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#EADCC5] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#29231D]">{title}</h2>

        <p className="mt-1 text-sm text-[#756A5C]">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#29231D]">
        {label}

        {required && <span className="ml-1 text-[#B7832F]">*</span>}
      </label>

      {children}
    </div>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <FormField label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#756A5C]">
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputClassName} pl-8`}
        />
      </div>
    </FormField>
  );
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatPropertyOption(property: PropertyOption): string {
  const address = property.property_address_line_1 || "Unnamed Property";

  const cityState = [property.property_city, property.property_state]
    .filter(Boolean)
    .join(", ");

  const location = [cityState, property.property_postal_code]
    .filter(Boolean)
    .join(" ");

  return [address, location].filter(Boolean).join(" — ");
}
