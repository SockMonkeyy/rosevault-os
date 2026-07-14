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
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#B7AEA2] hover:border-[#D5CABB] focus:border-[#B7832F]/60 focus:bg-white focus:ring-2 focus:ring-[#B7832F]/10";

  const selectClasses =
    "rounded-l-md border-y border-l border-[#E3DCD0] bg-[#F5EEDF]/70 px-3 py-3 text-xs font-medium text-[#5F574D] outline-none transition-all duration-300 hover:border-[#D5CABB] focus:border-[#B7832F]/60 focus:bg-white focus:ring-2 focus:ring-[#B7832F]/10";

  const inputGroupClasses =
    "w-full rounded-r-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#B7AEA2] hover:border-[#D5CABB] focus:border-[#B7832F]/60 focus:bg-white focus:ring-2 focus:ring-[#B7832F]/10";

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

  const sectionClasses =
    "rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#D8B66A]/25 hover:bg-white/50 hover:shadow-sm sm:p-8";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-6 py-3 text-center text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-12 lg:px-12 lg:py-16">
      {/* Editorial Page Header */}
      <header className="mb-12 border-b border-[#EDE7DC]/60 pb-8">
        <Link
          href="/contacts"
          className="group inline-flex cursor-pointer items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F] transition-colors duration-300 hover:text-[#916520]"
        >
          <span className="mr-1 transform transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          Back to Contact Registry
        </Link>

        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Contact Registry
          </p>

          <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
            Add New Contact
          </h1>

          <p className="mt-3 max-w-3xl text-xs leading-relaxed tracking-wide text-[#7C7265]">
            Add a client, lead, investor, agent, vendor, or other business
            relationship to your RoseVault contact registry.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Contact Identity"
            title="Basic Information"
            description="Enter the contact's primary identity and communication details."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClasses}>
                First Name *
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
                Last Name
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
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
            </div>

            <PhoneField
              id="primaryPhone"
              label="Primary Phone"
              value={primaryPhone}
              phoneType={primaryPhoneType}
              onValueChange={setPrimaryPhone}
              onTypeChange={setPrimaryPhoneType}
              placeholder="(205) 555-1234"
              selectClasses={selectClasses}
              inputClasses={inputGroupClasses}
              labelClasses={labelClasses}
            />

            <PhoneField
              id="secondaryPhone"
              label="Secondary Phone"
              value={secondaryPhone}
              phoneType={secondaryPhoneType}
              onValueChange={setSecondaryPhone}
              onTypeChange={setSecondaryPhoneType}
              placeholder="(205) 555-5678"
              selectClasses={selectClasses}
              inputClasses={inputGroupClasses}
              labelClasses={labelClasses}
            />
          </div>
        </section>

        {/* Spouse Contact Information */}
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Relationship Details"
            title="Spouse Contact Information"
            description="Optional information for a spouse or partner involved in the relationship or transaction process."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="spouseFirstName" className={labelClasses}>
                First Name
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
                Last Name
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
                Email Address
              </label>
              <input
                id="spouseEmail"
                type="email"
                value={spouseEmail}
                onChange={(e) => setSpouseEmail(e.target.value)}
                className={inputClasses}
              />
            </div>

            <PhoneField
              id="spousePrimaryPhone"
              label="Spouse Primary Phone"
              value={spousePrimaryPhone}
              phoneType={spousePrimaryPhoneType}
              onValueChange={setSpousePrimaryPhone}
              onTypeChange={setSpousePrimaryPhoneType}
              placeholder="(205) 555-1234"
              selectClasses={selectClasses}
              inputClasses={inputGroupClasses}
              labelClasses={labelClasses}
            />

            <PhoneField
              id="spouseSecondaryPhone"
              label="Spouse Secondary Phone"
              value={spouseSecondaryPhone}
              phoneType={spouseSecondaryPhoneType}
              onValueChange={setSpouseSecondaryPhone}
              onTypeChange={setSpouseSecondaryPhoneType}
              placeholder="(205) 555-5678"
              selectClasses={selectClasses}
              inputClasses={inputGroupClasses}
              labelClasses={labelClasses}
            />
          </div>
        </section>

        {/* CRM Classification */}
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Contact Intelligence"
            title="CRM Classification"
            description="Categorize this contact for filtering, workflows, marketing, and future RoseVault automations."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="contactType" className={labelClasses}>
                Contact Type
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
                Lead Source
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
                Preferred Contact Method
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
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Professional Details"
            title="Company Information"
            description="Optional professional or business details associated with this contact."
          />

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
                Job Title
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
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Correspondence"
            title="Mailing Address"
            description="Used for client records, correspondence, and mailing-label generation."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="addressLine1" className={labelClasses}>
                Address Line 1
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
                Address Line 2
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
                ZIP / Postal Code
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
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Real Estate"
            title="Property Address"
            description="The address of the property associated with this contact."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="propertyAddressLine1"
                className={labelClasses}
              >
                Address Line 1
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
              <label
                htmlFor="propertyAddressLine2"
                className={labelClasses}
              >
                Address Line 2
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
                ZIP / Postal Code
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
        <section className={sectionClasses}>
          <SectionHeader
            eyebrow="Relationship Notes"
            title="Notes"
            description="Record important context, preferences, conversations, or details about this relationship."
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Add notes about this contact..."
            className={`${inputClasses} resize-y`}
          />
        </section>

        {/* Error Message */}
        {message && (
          <div className="rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#EDE7DC]/80 pt-6 sm:flex-row sm:justify-end">
          <Link href="/contacts" className={secondaryButtonClasses}>
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-md bg-[#0D0C0A] px-6 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving Contact..." : "Save Contact"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
        {eyebrow}
      </p>

      <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
        {title}
      </h2>

      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#7C7265]">
        {description}
      </p>
    </div>
  );
}

function PhoneField({
  id,
  label,
  value,
  phoneType,
  onValueChange,
  onTypeChange,
  placeholder,
  selectClasses,
  inputClasses,
  labelClasses,
}: {
  id: string;
  label: string;
  value: string;
  phoneType: string;
  onValueChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  placeholder: string;
  selectClasses: string;
  inputClasses: string;
  labelClasses: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>

      <div className="flex">
        <select
          aria-label={`${label} type`}
          value={phoneType}
          onChange={(e) => onTypeChange(e.target.value)}
          className={selectClasses}
        >
          <option value="mobile">Cell</option>
          <option value="work">Business</option>
          <option value="home">Home</option>
          <option value="other">Other</option>
        </select>

        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
      </div>
    </div>
  );
}
