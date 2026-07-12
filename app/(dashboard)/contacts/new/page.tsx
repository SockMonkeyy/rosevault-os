"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();

  // Primary Contact State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Primary Contact Phone Setup
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [primaryPhoneType, setPrimaryPhoneType] = useState("mobile"); // Changed from "cell"
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [secondaryPhoneType, setSecondaryPhoneType] = useState("work"); // Changed from "business"

  // Spouse Contact State
  const [spouseFirstName, setSpouseFirstName] = useState("");
  const [spouseLastName, setSpouseLastName] = useState("");
  const [spouseEmail, setSpouseEmail] = useState("");
  const [spousePrimaryPhone, setSpousePrimaryPhone] = useState("");
  const [spousePrimaryPhoneType, setSpousePrimaryPhoneType] =
    useState("mobile"); // Changed from "cell"
  const [spouseSecondaryPhone, setSpouseSecondaryPhone] = useState("");
  const [spouseSecondaryPhoneType, setSpouseSecondaryPhoneType] =
    useState("work"); // Changed from "business"

  // Classification & CRM Info
  const [contactType, setContactType] = useState("lead");
  const [status, setStatus] = useState("active");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [notes, setNotes] = useState("");

  // Mailing Address State
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Property Address State
  const [propertyAddressLine1, setPropertyAddressLine1] = useState("");
  const [propertyAddressLine2, setPropertyAddressLine2] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyPostalCode, setPropertyPostalCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Your session has expired. Please sign in again.");
      setIsSubmitting(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      setMessage("We could not find your organization workspace.");
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("contacts").insert({
      organization_id: membership.organization_id,

      // Primary contact information
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,

      // Primary contact phone information (CORRECTED MAPPING)
      cell_phone: primaryPhone.trim() || null,
      cell_phone_type: primaryPhoneType || null,

      business_phone: secondaryPhone.trim() || null,
      business_phone_type: secondaryPhoneType || null,

      // Spouse contact information
      spouse_first_name: spouseFirstName.trim() || null,
      spouse_last_name: spouseLastName.trim() || null,
      spouse_email: spouseEmail.trim() || null,

      // Spouse contact phone information (CORRECTED MAPPING)
      spouse_cell_phone: spousePrimaryPhone.trim() || null,
      spouse_cell_phone_type: spousePrimaryPhoneType || null,

      spouse_business_phone: spouseSecondaryPhone.trim() || null,
      spouse_business_phone_type: spouseSecondaryPhoneType || null,

      // Contact classification
      contact_type: contactType,
      status,
      company: company.trim() || null,
      job_title: jobTitle.trim() || null,

      // Mailing address
      mailing_address_line_1: addressLine1.trim() || null,
      mailing_address_line_2: addressLine2.trim() || null,
      mailing_city: city.trim() || null,
      mailing_state: state.trim().toUpperCase() || null,
      mailing_postal_code: postalCode.trim() || null,

      // Property address
      property_address_line_1: propertyAddressLine1.trim() || null,
      property_address_line_2: propertyAddressLine2.trim() || null,
      property_city: propertyCity.trim() || null,
      property_state: propertyState.trim().toUpperCase() || null,
      property_postal_code: propertyPostalCode.trim() || null,

      // Additional contact details
      lead_source: leadSource.trim() || null,
      preferred_contact_method: preferredContactMethod || null,
      notes: notes.trim() || null,

      created_by: user.id,
    });

    if (insertError) {
      setMessage(insertError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/contacts");
    router.refresh();
  }

  const inputClasses =
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  const selectClasses =
    "rounded-l-lg border-y border-l border-[#333333] bg-[#111111] px-3 py-3 text-sm text-gray-300 outline-none transition focus:border-[#d4af37] focus:text-white";

  const inputGroupClasses =
    "w-full rounded-r-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  const labelClasses = "mb-2 block text-sm font-medium text-gray-300";

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/contacts"
            className="mb-4 inline-block text-sm text-[#d4af37] hover:underline"
          >
            ← Back to Contacts
          </Link>
          <h1 className="text-3xl font-semibold">Add New Contact</h1>
          <p className="mt-2 text-gray-400">
            Add a client, lead, investor, agent, vendor, or other business
            relationship.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the contact&apos;s primary information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClasses}>
                  First name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClasses}>
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className={labelClasses}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Primary Phone Input Group */}
              <div>
                <label htmlFor="primaryPhone" className={labelClasses}>
                  Primary phone
                </label>
                <div className="flex">
                  <select
                    aria-label="Primary phone type"
                    value={primaryPhoneType}
                    onChange={(e) => setPrimaryPhoneType(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="mobile">Cell</option>{" "}
                    {/* Changed value to "mobile" */}
                    <option value="work">Business</option>{" "}
                    {/* Changed value to "work" */}
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    id="primaryPhone"
                    type="tel"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    placeholder="(205) 555-1234"
                    className={inputGroupClasses}
                  />
                </div>
              </div>

              {/* Secondary Phone Input Group */}
              <div>
                <label htmlFor="secondaryPhone" className={labelClasses}>
                  Secondary phone
                </label>
                <div className="flex">
                  <select
                    aria-label="Secondary phone type"
                    value={secondaryPhoneType}
                    onChange={(e) => setSecondaryPhoneType(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="mobile">Cell</option>{" "}
                    {/* Changed value to "mobile" */}
                    <option value="work">Business</option>{" "}
                    {/* Changed value to "work" */}
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    id="secondaryPhone"
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="(205) 555-5678"
                    className={inputGroupClasses}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Spouse Contact Information */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Spouse Contact Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Optional information for a spouse or partner involved in the
                transaction process.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="spouseFirstName" className={labelClasses}>
                  First name
                </label>
                <input
                  id="spouseFirstName"
                  type="text"
                  value={spouseFirstName}
                  onChange={(e) => setSpouseFirstName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="spouseLastName" className={labelClasses}>
                  Last name
                </label>
                <input
                  id="spouseLastName"
                  type="text"
                  value={spouseLastName}
                  onChange={(e) => setSpouseLastName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="spouseEmail" className={labelClasses}>
                  Email address
                </label>
                <input
                  id="spouseEmail"
                  type="email"
                  value={spouseEmail}
                  onChange={(e) => setSpouseEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Spouse Primary Phone */}
              <div>
                <label htmlFor="spousePrimaryPhone" className={labelClasses}>
                  Spouse primary phone
                </label>
                <div className="flex">
                  <select
                    aria-label="Spouse primary phone type"
                    value={spousePrimaryPhoneType}
                    onChange={(e) => setSpousePrimaryPhoneType(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="cell">Cell</option>
                    <option value="business">Business</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    id="spousePrimaryPhone"
                    type="tel"
                    value={spousePrimaryPhone}
                    onChange={(e) => setSpousePrimaryPhone(e.target.value)}
                    placeholder="(205) 555-1234"
                    className={inputGroupClasses}
                  />
                </div>
              </div>

              {/* Spouse Secondary Phone */}
              <div>
                <label htmlFor="spouseSecondaryPhone" className={labelClasses}>
                  Spouse secondary phone
                </label>
                <div className="flex">
                  <select
                    aria-label="Spouse secondary phone type"
                    value={spouseSecondaryPhoneType}
                    onChange={(e) =>
                      setSpouseSecondaryPhoneType(e.target.value)
                    }
                    className={selectClasses}
                  >
                    <option value="cell">Cell</option>
                    <option value="business">Business</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    id="spouseSecondaryPhone"
                    type="tel"
                    value={spouseSecondaryPhone}
                    onChange={(e) => setSpouseSecondaryPhone(e.target.value)}
                    placeholder="(205) 555-5678"
                    className={inputGroupClasses}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CRM Classification */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">CRM Classification</h2>
              <p className="mt-1 text-sm text-gray-500">
                Categorize this contact for filtering, workflows, and future
                automations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="contactType" className={labelClasses}>
                  Contact type
                </label>
                <select
                  id="contactType"
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  className={inputClasses}
                >
                  <option value="lead">Lead</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="investor">Investor</option>
                  <option value="agent">Agent</option>
                  <option value="lender">Lender</option>
                  <option value="attorney">Attorney</option>
                  <option value="contractor">Contractor</option>
                  <option value="vendor">Vendor</option>
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClasses}
                >
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="nurture">Nurture</option>
                  <option value="inactive">Inactive</option>
                  <option value="past_client">Past Client</option>
                  <option value="do_not_contact">Do Not Contact</option>
                </select>
              </div>

              <div>
                <label htmlFor="leadSource" className={labelClasses}>
                  Lead source
                </label>
                <input
                  id="leadSource"
                  type="text"
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  placeholder="Referral, website, Facebook, open house..."
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="preferredContactMethod"
                  className={labelClasses}
                >
                  Preferred contact method
                </label>
                <select
                  id="preferredContactMethod"
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Not specified</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text message</option>
                </select>
              </div>
            </div>
          </section>

          {/* Company Information */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Company Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Optional professional or business details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="company" className={labelClasses}>
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className={labelClasses}>
                  Job title
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          {/* Mailing Address */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Mailing Address</h2>
              <p className="mt-1 text-sm text-gray-500">
                Used for client records and future mailing-label generation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="addressLine1" className={labelClasses}>
                  Address line 1
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="addressLine2" className={labelClasses}>
                  Address line 2
                </label>
                <input
                  id="addressLine2"
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, unit..."
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="city" className={labelClasses}>
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="state" className={labelClasses}>
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="postalCode" className={labelClasses}>
                  ZIP / Postal code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          {/* Property Address */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Property Address</h2>
              <p className="mt-1 text-sm text-gray-500">
                The address of the property associated with this contact.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="propertyAddressLine1" className={labelClasses}>
                  Address line 1
                </label>
                <input
                  id="propertyAddressLine1"
                  type="text"
                  value={propertyAddressLine1}
                  onChange={(e) => setPropertyAddressLine1(e.target.value)}
                  className={inputClasses}
                  placeholder="123 Main Street"
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
                  onChange={(e) => setPropertyAddressLine2(e.target.value)}
                  className={inputClasses}
                  placeholder="Unit, suite, apartment, etc."
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
                  onChange={(e) => setPropertyCity(e.target.value)}
                  className={inputClasses}
                  placeholder="Birmingham"
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
                  onChange={(e) => setPropertyState(e.target.value)}
                  className={inputClasses}
                  placeholder="AL"
                  maxLength={2}
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
                  onChange={(e) => setPropertyPostalCode(e.target.value)}
                  className={inputClasses}
                  placeholder="35203"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Notes</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add anything important about this relationship.
              </p>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Add notes about this contact..."
              className={inputClasses}
            />
          </section>

          {/* Error Message */}
          {message && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/contacts"
              className="rounded-lg border border-[#333333] px-6 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving contact..." : "Save Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
