"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AddPropertyPage() {
  const router = useRouter();

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

  // Form state
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!propertyAddressLine1.trim()) {
      setErrorMessage("Property address line 1 is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("You must be signed in to add a property.");
      setIsSaving(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      setErrorMessage(
        membershipError?.message ||
          "Your organization workspace could not be found.",
      );
      setIsSaving(false);
      return;
    }

    const { data: newProperty, error: insertError } = await supabase
      .from("properties")
      .insert({
        organization_id: membership.organization_id,
        created_by: user.id,

        // Property address
        property_address_line_1: propertyAddressLine1.trim(),
        property_address_line_2:
          propertyAddressLine2.trim() || null,
        property_city: propertyCity.trim() || null,
        property_state:
          propertyState.trim().toUpperCase() || null,
        property_postal_code:
          propertyPostalCode.trim() || null,

        // Property identification
        county: county.trim() || null,
        parcel_number: parcelNumber.trim() || null,
        property_type: propertyType.trim() || null,

        // Property details
        bedrooms: parseOptionalNumber(bedrooms),
        bathrooms: parseOptionalNumber(bathrooms),
        square_feet: parseOptionalInteger(squareFeet),
        year_built: parseOptionalInteger(yearBuilt),

        // Financial information
        estimated_value: parseOptionalNumber(estimatedValue),
        asking_price: parseOptionalNumber(askingPrice),
        mortgage_balance: parseOptionalNumber(mortgageBalance),

        // Additional information
        notes: notes.trim() || null,

        // Confirmed existing status from the importer
        property_status: "prospect",
      })
      .select("id")
      .single();

    if (insertError || !newProperty) {
      setErrorMessage(
        insertError?.message || "Unable to save the property.",
      );
      setIsSaving(false);
      return;
    }

    router.push(`/properties/${newProperty.id}`);
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/properties"
            className="mb-4 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
          >
            ← Back to Properties
          </Link>

          <h1 className="text-3xl font-semibold text-white">
            Add New Property
          </h1>

          <p className="mt-2 text-gray-400">
            Create a property record and begin tracking its details,
            financials, contacts, and future transactions in RoseVault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Address */}
          <FormSection
            title="Property Address"
            description="The physical location of the property."
          >
            <div className="md:col-span-2">
              <label
                htmlFor="propertyAddressLine1"
                className={labelClasses}
              >
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
              <label
                htmlFor="propertyAddressLine2"
                className={labelClasses}
              >
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
                onChange={(event) =>
                  setPropertyCity(event.target.value)
                }
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
                onChange={(event) =>
                  setPropertyState(event.target.value)
                }
                placeholder="AL"
                maxLength={2}
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="propertyPostalCode"
                className={labelClasses}
              >
                ZIP / Postal code
              </label>

              <input
                id="propertyPostalCode"
                type="text"
                value={propertyPostalCode}
                onChange={(event) =>
                  setPropertyPostalCode(event.target.value)
                }
                placeholder="35203"
                className={inputClasses}
              />
            </div>
          </FormSection>

          {/* Identification */}
          <FormSection
            title="Property Identification"
            description="County, parcel number, and property classification."
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
                onChange={(event) =>
                  setParcelNumber(event.target.value)
                }
                placeholder="Parcel or APN number"
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="propertyType" className={labelClasses}>
                Property type
              </label>

              <input
                id="propertyType"
                type="text"
                value={propertyType}
                onChange={(event) =>
                  setPropertyType(event.target.value)
                }
                placeholder="Single family, condo, land..."
                className={inputClasses}
              />

              <p className="mt-2 text-xs text-gray-600">
                We're keeping this field open until the allowed property-type
                values in the live database are verified.
              </p>
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
                onChange={(event) =>
                  setBedrooms(event.target.value)
                }
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
                onChange={(event) =>
                  setBathrooms(event.target.value)
                }
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
                onChange={(event) =>
                  setSquareFeet(event.target.value)
                }
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
                onChange={(event) =>
                  setYearBuilt(event.target.value)
                }
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

          {/* Error */}
          {errorMessage && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-5 py-4 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#2a2a2a] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/properties"
              className="rounded-lg border border-[#333333] px-5 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#555555] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving Property..." : "Save Property"}
            </button>
          </div>
        </form>
      </div>
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
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {children}
      </div>
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
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
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

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

const labelClasses =
  "mb-2 block text-sm font-medium text-gray-300";

const inputClasses =
  "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";