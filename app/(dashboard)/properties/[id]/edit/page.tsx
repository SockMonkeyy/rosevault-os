"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PropertyRecord = {
  id: string;
  property_address_line_1: string | null;
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
};

// Available statuses for the application
const STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const propertyId = params.id;

  // Property address
  const [propertyAddressLine1, setPropertyAddressLine1] = useState("");
  const [propertyAddressLine2, setPropertyAddressLine2] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyPostalCode, setPropertyPostalCode] = useState("");

  // Property identification
  const [county, setCounty] = useState("");
  const [parcelNumber, setParcelNumber] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("prospect");

  // Property details
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  // Financial information
  const [estimatedValue, setEstimatedValue] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [mortgageBalance, setMortgageBalance] = useState("");

  // Additional information
  const [notes, setNotes] = useState("");

  // Page state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProperty() {
      if (!propertyId) {
        if (isMounted) {
          setLoadFailed(true);
          setErrorMessage("Property ID is missing.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadFailed(false);
      setErrorMessage("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (membershipError) {
        setLoadFailed(true);
        setErrorMessage(
          `Unable to load your organization: ${membershipError.message}`,
        );
        setIsLoading(false);
        return;
      }

      if (!membership) {
        router.replace("/onboarding");
        return;
      }

      const { data, error } = await supabase
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
          notes
        `,
        )
        .eq("id", propertyId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setLoadFailed(true);
        setErrorMessage(`Unable to load property: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setLoadFailed(true);
        setErrorMessage(
          "Property not found or you do not have access to this property.",
        );
        setIsLoading(false);
        return;
      }

      const property = data as PropertyRecord;

      setPropertyAddressLine1(property.property_address_line_1 ?? "");
      setPropertyAddressLine2(property.property_address_line_2 ?? "");
      setPropertyCity(property.property_city ?? "");
      setPropertyState(property.property_state ?? "");
      setPropertyPostalCode(property.property_postal_code ?? "");

      setCounty(property.county ?? "");
      setParcelNumber(property.parcel_number ?? "");
      setPropertyType(property.property_type ?? "");
      setPropertyStatus(property.property_status ?? "prospect");

      setBedrooms(numberToInputValue(property.bedrooms));
      setBathrooms(numberToInputValue(property.bathrooms));
      setSquareFeet(numberToInputValue(property.square_feet));
      setYearBuilt(numberToInputValue(property.year_built));

      setEstimatedValue(numberToInputValue(property.estimated_value));
      setAskingPrice(numberToInputValue(property.asking_price));
      setMortgageBalance(numberToInputValue(property.mortgage_balance));

      setNotes(property.notes ?? "");

      setLoadFailed(false);
      setIsLoading(false);
    }

    void loadProperty();

    return () => {
      isMounted = false;
    };
  }, [propertyId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!propertyId) {
      setErrorMessage("Property ID is missing.");
      return;
    }

    if (!propertyAddressLine1.trim()) {
      setErrorMessage("Property address line 1 is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("You must be signed in to edit this property.");
        setIsSaving(false);
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) {
        setErrorMessage(
          `Unable to verify your organization: ${membershipError.message}`,
        );
        setIsSaving(false);
        return;
      }

      if (!membership) {
        setErrorMessage("Your organization workspace could not be found.");
        setIsSaving(false);
        return;
      }

      const updatePayload = {
        property_address_line_1: propertyAddressLine1.trim(),
        property_address_line_2: propertyAddressLine2.trim() || null,
        property_city: propertyCity.trim() || null,
        property_state: propertyState.trim().toUpperCase() || null,
        property_postal_code: propertyPostalCode.trim() || null,

        county: county.trim() || null,
        parcel_number: parcelNumber.trim() || null,
        property_type: propertyType.trim() || null,
        property_status: propertyStatus.trim() || "prospect",

        bedrooms: parseOptionalNumber(bedrooms),
        bathrooms: parseOptionalNumber(bathrooms),
        square_feet: parseOptionalInteger(squareFeet),
        year_built: parseOptionalInteger(yearBuilt),

        estimated_value: parseOptionalNumber(estimatedValue),
        asking_price: parseOptionalNumber(askingPrice),
        mortgage_balance: parseOptionalNumber(mortgageBalance),

        notes: notes.trim() || null,
      };

      const { data: updatedProperty, error: updateError } = await supabase
        .from("properties")
        .update(updatePayload)
        .eq("id", propertyId)
        .eq("organization_id", membership.organization_id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        setErrorMessage(`Unable to update property: ${updateError.message}`);
        setIsSaving(false);
        return;
      }

      if (!updatedProperty) {
        setErrorMessage(
          "The property was not updated. The record may no longer exist or may not belong to your organization.",
        );
        setIsSaving(false);
        return;
      }

      router.push(`/properties/${updatedProperty.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to update property: ${error.message}`
          : "An unexpected error occurred while updating the property.",
      );
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!propertyId) return;

    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("You must be signed in.");
        setIsDeleting(false);
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) {
        setErrorMessage(membershipError.message);
        setIsDeleting(false);
        return;
      }

      if (!membership) {
        setErrorMessage("Organization not found.");
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("organization_id", membership.organization_id);

      if (error) {
        setErrorMessage(error.message);
        setIsDeleting(false);
        return;
      }

      router.push("/properties?deleted=true");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to delete property.",
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl border border-[#EDE7DC] bg-white/45 px-6 py-16 text-center backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
              Loading property...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/properties"
            className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-[#B7832F] transition-all duration-300 hover:text-[#D8B66A] hover:translate-x-[-2px]"
          >
            ← Back to Properties
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 backdrop-blur-sm">
            <h1 className="font-serif text-xl font-normal text-red-800">
              Unable to Load Property
            </h1>

            <p className="mt-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>

            <Link
              href="/properties"
              className="mt-6 inline-block rounded-lg border border-red-300 bg-white/80 px-4 py-2 text-sm font-medium text-red-700 transition-all duration-300 hover:bg-red-50 hover:border-red-400"
            >
              Return to Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F6] p-8 relative">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/properties/${propertyId}`}
            className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-[#B7832F] transition-all duration-300 hover:text-[#D8B66A] hover:translate-x-[-2px]"
          >
            ← Back to Property
          </Link>

          <h1 className="font-serif text-3xl font-normal text-[#B7832F]">
            Edit Property
          </h1>

          <p className="mt-2 text-sm text-[#5C544A]">
            Update property details, financial information, and notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Address */}
          <FormSection
            title="Property Address"
            description="The physical location of the property."
          >
            <div className="md:col-span-2">
              <label htmlFor="propertyAddressLine1" className={labelClasses}>
                Address line 1 *
              </label>
              <input
                id="propertyAddressLine1"
                type="text"
                required
                value={propertyAddressLine1}
                onChange={(event) =>
                  setPropertyAddressLine1(event.target.value)
                }
                placeholder="123 Main Street"
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="propertyAddressLine2" className={labelClasses}>
                Address line 2
              </label>
              <input
                id="propertyAddressLine2"
                type="text"
                value={propertyAddressLine2}
                onChange={(event) =>
                  setPropertyAddressLine2(event.target.value)
                }
                placeholder="Apartment, suite, unit..."
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="propertyCity" className={labelClasses}>
                City
              </label>
              <input
                id="propertyCity"
                type="text"
                value={propertyCity}
                onChange={(event) => setPropertyCity(event.target.value)}
                placeholder="Birmingham"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="propertyState" className={labelClasses}>
                State
              </label>
              <input
                id="propertyState"
                type="text"
                value={propertyState}
                onChange={(event) => setPropertyState(event.target.value)}
                placeholder="AL"
                maxLength={2}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="propertyPostalCode" className={labelClasses}>
                ZIP / Postal code
              </label>
              <input
                id="propertyPostalCode"
                type="text"
                value={propertyPostalCode}
                onChange={(event) => setPropertyPostalCode(event.target.value)}
                placeholder="35203"
                className={inputClasses}
              />
            </div>
          </FormSection>

          {/* Property Identification */}
          <FormSection
            title="Property Identification"
            description="County, parcel number, classification, and current status."
          >
            <div>
              <label htmlFor="county" className={labelClasses}>
                County
              </label>
              <input
                id="county"
                type="text"
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                placeholder="Jefferson"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="parcelNumber" className={labelClasses}>
                Parcel number
              </label>
              <input
                id="parcelNumber"
                type="text"
                value={parcelNumber}
                onChange={(event) => setParcelNumber(event.target.value)}
                placeholder="Parcel or APN number"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="propertyType" className={labelClasses}>
                Property type
              </label>
              <input
                id="propertyType"
                type="text"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                placeholder="Single family, condo, land..."
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="propertyStatus" className={labelClasses}>
                Property status
              </label>
              <select
                id="propertyStatus"
                value={propertyStatus}
                onChange={(event) => setPropertyStatus(event.target.value)}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

          {/* Property Details */}
          <FormSection
            title="Property Details"
            description="Physical characteristics and construction information."
          >
            <div>
              <label htmlFor="bedrooms" className={labelClasses}>
                Bedrooms
              </label>
              <input
                id="bedrooms"
                type="number"
                min="0"
                step="1"
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                placeholder="3"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="bathrooms" className={labelClasses}>
                Bathrooms
              </label>
              <input
                id="bathrooms"
                type="number"
                min="0"
                step="0.5"
                value={bathrooms}
                onChange={(event) => setBathrooms(event.target.value)}
                placeholder="2"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="squareFeet" className={labelClasses}>
                Square feet
              </label>
              <input
                id="squareFeet"
                type="number"
                min="0"
                step="1"
                value={squareFeet}
                onChange={(event) => setSquareFeet(event.target.value)}
                placeholder="1800"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="yearBuilt" className={labelClasses}>
                Year built
              </label>
              <input
                id="yearBuilt"
                type="number"
                min="1000"
                max="9999"
                step="1"
                value={yearBuilt}
                onChange={(event) => setYearBuilt(event.target.value)}
                placeholder="1998"
                className={inputClasses}
              />
            </div>
          </FormSection>

          {/* Financial Information */}
          <FormSection
            title="Financial Information"
            description="Known values, seller expectations, and mortgage information."
          >
            <CurrencyField
              id="estimatedValue"
              label="Estimated value"
              value={estimatedValue}
              onChange={setEstimatedValue}
              placeholder="250000"
            />

            <CurrencyField
              id="askingPrice"
              label="Asking price"
              value={askingPrice}
              onChange={setAskingPrice}
              placeholder="225000"
            />

            <CurrencyField
              id="mortgageBalance"
              label="Mortgage balance"
              value={mortgageBalance}
              onChange={setMortgageBalance}
              placeholder="150000"
            />
          </FormSection>

          {/* Notes */}
          <FormSection
            title="Notes"
            description="Property condition, seller situation, repair needs, or other important context."
          >
            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelClasses}>
                Property notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={7}
                placeholder="Add any important details about the property..."
                className={inputClasses}
              />
            </div>
          </FormSection>

          {/* Danger Zone */}
          <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 backdrop-blur-sm">
            <div className="mb-4">
              <h2 className="font-serif text-xl font-normal text-red-700">
                Danger Zone
              </h2>

              <p className="mt-2 text-sm text-red-600">
                Permanently delete this property from RoseVault. This action
                cannot be undone. Any linked contact relationships will
                automatically be removed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting Property..." : "Delete Property"}
            </button>
          </section>

          {/* Save error */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-5 py-4 text-sm text-red-700 backdrop-blur-sm">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EDE7DC] pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/properties/${propertyId}`}
              className="rounded-lg border border-[#EDE7DC] bg-white px-5 py-3 text-center text-sm font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-[#FBF9F6] hover:text-[#B7832F] hover:shadow-sm"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#B7832F] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#A37225] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Elegant RoseVault Confirmation Overlay Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C544A]/30 backdrop-blur-md transition-opacity duration-300">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-serif text-2xl font-normal text-red-800">
                Delete Property
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5C544A]">
                You&apos;re about to permanently delete the following property:
              </p>

              <div className="mt-4 rounded-xl border border-[#EDE7DC] bg-[#FBF9F6] px-4 py-3">
                <p className="font-medium text-[#29231D]">
                  {propertyAddressLine1 || "Unnamed Property"}
                </p>

                {(propertyCity || propertyState || propertyPostalCode) && (
                  <p className="mt-1 text-sm text-[#7C7265]">
                    {[propertyCity, propertyState, propertyPostalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#5C544A]">
                This action cannot be undone. Any linked contact relationships
                will also be removed.
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-[#EDE7DC] bg-white px-4 py-2.5 text-center text-sm font-medium text-[#7C7265] transition-all duration-300 hover:bg-[#FBF9F6] hover:border-[#D8B66A]/40"
              >
                No, Keep Record
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-md"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <section className="rounded-2xl border border-[#EDE7DC] bg-white/45 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm">
      <div className="mb-6">
        <h2 className="font-serif text-xl font-normal text-[#B7832F]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#5C544A]">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function CurrencyField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8F8578] font-medium">
          $
        </span>

        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputClasses} pl-8`}
        />
      </div>
    </div>
  );
}

function numberToInputValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const labelClasses =
  "mb-2 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

const inputClasses =
  "w-full rounded-lg border border-[#EDE7DC] bg-white/70 px-4 py-3 text-[#5C544A] outline-none transition-all duration-300 placeholder:text-[#8F8578]/40 focus:border-[#B7832F] focus:bg-white focus:shadow-sm";
