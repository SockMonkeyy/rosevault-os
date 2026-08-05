"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

function Field({ label, className = "", children }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
        {label}
      </label>
      {children}
    </div>
  );
}

type FormSectionProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  isFullWidth?: boolean;
  children: ReactNode;
};

function FormSection({
  title,
  description,
  eyebrow,
  isFullWidth = false,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-[#E8E0D4] bg-[#FCFAF7]/80 p-6 shadow-[0_10px_30px_rgba(41,35,29,0.03)]">
      <div className="mb-6 flex flex-col gap-2">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-xl font-normal tracking-wide text-[#29231D]">
          {title}
        </h2>
        {description && <p className="text-sm leading-6 text-[#7C7265]">{description}</p>}
      </div>
      <div className={`grid gap-4 ${isFullWidth ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {children}
      </div>
    </section>
  );
}

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const contactId = params.id;

  const [contactKind, setContactKind] = useState<"person" | "business">("person");
  const [businessName, setBusinessName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [cellPhoneType, setCellPhoneType] = useState("mobile");
  const [businessPhoneType, setBusinessPhoneType] = useState("work");

  const [contactType, setContactType] = useState("lead");
  const [status, setStatus] = useState("active");
  const [leadSource, setLeadSource] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [spouseFirstName, setSpouseFirstName] = useState("");
  const [spouseLastName, setSpouseLastName] = useState("");
  const [spouseEmail, setSpouseEmail] = useState("");
  const [spouseCellPhone, setSpouseCellPhone] = useState("");
  const [spouseBusinessPhone, setSpouseBusinessPhone] = useState("");
  const [spouseCellPhoneType, setSpouseCellPhoneType] = useState("mobile");
  const [spouseBusinessPhoneType, setSpouseBusinessPhoneType] = useState("work");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [propertyAddressLine1, setPropertyAddressLine1] = useState("");
  const [propertyAddressLine2, setPropertyAddressLine2] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyPostalCode, setPropertyPostalCode] = useState("");

  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadContact() {
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        router.push("/onboarding");
        return;
      }

      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (contactError || !contact) {
        setMessage("We could not find this contact.");
        setIsLoading(false);
        return;
      }

      setContactKind(contact.contact_kind ?? "person");
      setBusinessName(contact.business_name ?? "");
      setFirstName(contact.first_name ?? "");
      setLastName(contact.last_name ?? "");
      setEmail(contact.email ?? "");
      setCellPhone(contact.primary_phone ?? "");
      setBusinessPhone(contact.secondary_phone ?? "");
      setCellPhoneType(contact.primary_phone_type ?? "mobile");
      setBusinessPhoneType(contact.secondary_phone_type ?? "work");

      setContactType(contact.contact_type ?? "lead");
      setStatus(contact.status ?? "active");
      setLeadSource(contact.lead_source ?? "");
      setPreferredContactMethod(contact.preferred_contact_method ?? "");

      setCompany(contact.company ?? "");
      setJobTitle(contact.job_title ?? "");

      setSpouseFirstName(contact.spouse_first_name ?? "");
      setSpouseLastName(contact.spouse_last_name ?? "");
      setSpouseEmail(contact.spouse_email ?? "");
      setSpouseCellPhone(contact.spouse_primary_phone ?? "");
      setSpouseCellPhoneType(contact.spouse_primary_phone_type ?? "mobile");

      setSpouseBusinessPhone(contact.spouse_secondary_phone ?? "");
      setSpouseBusinessPhoneType(contact.spouse_secondary_phone_type ?? "work");

      // Mailing address
      setAddressLine1(contact.mailing_address_line_1 ?? "");
      setAddressLine2(contact.mailing_address_line_2 ?? "");
      setCity(contact.mailing_city ?? "");
      setState(contact.mailing_state ?? "");
      setPostalCode(contact.mailing_postal_code ?? "");

      // Property address
      setPropertyAddressLine1(contact.property_address_line_1 ?? "");
      setPropertyAddressLine2(contact.property_address_line_2 ?? "");
      setPropertyCity(contact.property_city ?? "");
      setPropertyState(contact.property_state ?? "");
      setPropertyPostalCode(contact.property_postal_code ?? "");

      setNotes(contact.notes ?? "");
      setIsLoading(false);
    }

    loadContact();
  }, [contactId, router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    if (contactKind === "person") {
      if (!firstName.trim() || !lastName.trim()) {
        setMessage("First and last name are required for person contacts.");
        setIsSubmitting(false);
        return;
      }
    }

    if (contactKind === "business") {
      if (!businessName.trim()) {
        setMessage("Business name is required.");
        setIsSubmitting(false);
        return;
      }
    }

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
      setMessage("We could not find your Workspace organization profile.");
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        contact_kind: contactKind,
        business_name:
          contactKind === "business"
            ? businessName.trim() || null
            : null,
        display_name:
          contactKind === "business"
            ? businessName.trim()
            : `${firstName.trim()} ${lastName.trim()}`.trim(),
        first_name:
          contactKind === "person"
            ? firstName.trim()
            : firstName.trim() || null,
        last_name:
          contactKind === "person"
            ? lastName.trim() || null
            : lastName.trim() || null,
        email: email.trim() || null,
        primary_phone: cellPhone.trim() || null,
        primary_phone_type: cellPhoneType,
        secondary_phone: businessPhone.trim() || null,
        secondary_phone_type: businessPhoneType,

        contact_type: contactType,
        status,
        lead_source: leadSource.trim() || null,
        preferred_contact_method: preferredContactMethod || null,

        company: company.trim() || null,
        job_title: jobTitle.trim() || null,

        spouse_first_name: spouseFirstName.trim() || null,
        spouse_last_name: spouseLastName.trim() || null,
        spouse_email: spouseEmail.trim() || null,
        spouse_primary_phone: spouseCellPhone.trim() || null,
        spouse_primary_phone_type: spouseCellPhoneType,
        spouse_secondary_phone: spouseBusinessPhone.trim() || null,
        spouse_secondary_phone_type: spouseBusinessPhoneType,

        mailing_address_line_1: addressLine1.trim() || null,
        mailing_address_line_2: addressLine2.trim() || null,
        mailing_city: city.trim() || null,
        mailing_state: state.trim().toUpperCase() || null,
        mailing_postal_code: postalCode.trim() || null,

        property_address_line_1: propertyAddressLine1.trim() || null,
        property_address_line_2: propertyAddressLine2.trim() || null,
        property_city: propertyCity.trim() || null,
        property_state: propertyState.trim().toUpperCase() || null,
        property_postal_code: propertyPostalCode.trim() || null,

        notes: notes.trim() || null,
      })
      .eq("id", contactId)
      .eq("organization_id", membership.organization_id);

    if (updateError) {
      setMessage(updateError.message);
      setIsSubmitting(false);
      return;
    }

    router.push(`/contacts/${contactId}`);
    router.refresh();
  }

  const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-6 py-3 text-center text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-6 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0D0C0A] disabled:hover:text-[#D8B66A] disabled:hover:shadow-none";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-8 py-10">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E3DCD0] border-t-[#B7832F]" />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
            Loading Contact
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
            href={`/contacts/${contactId}`}
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              &larr;
            </span>
            Back to Contact
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Relationship Record
            </p>
            <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              {contactKind === "business" ? "Edit Business Contact" : "Edit Person Contact"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
              Update contact details, CRM information, spouse information,
              mailing and property addresses, and relationship notes.
            </p>
          </div>
        </div>

        {/* Top Error Message */}
        {message && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <FormSection
            description="Update the contact's primary information and communication details."
            eyebrow="Primary Record"
            title="Basic Information"
          >
            <Field className="md:col-span-2" label="Contact Kind">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setContactKind("person")}
                  className={`rounded-md border px-5 py-3 text-sm transition ${
                    contactKind === "person"
                      ? "border-[#B7832F] bg-[#B7832F]/10"
                      : "border-[#E3DCD0] bg-white"
                  }`}
                >
                  👤 Person
                </button>

                <button
                  type="button"
                  onClick={() => setContactKind("business")}
                  className={`rounded-md border px-5 py-3 text-sm transition ${
                    contactKind === "business"
                      ? "border-[#B7832F] bg-[#B7832F]/10"
                      : "border-[#E3DCD0] bg-white"
                  }`}
                >
                  🏢 Business
                </button>
              </div>
            </Field>

            {contactKind === "person" ? (
              <Field label="First Name *">
                <input
                  type="text"
                  required={contactKind === "person"}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className={inputClasses}
                />
              </Field>
            ) : (
              <Field label="Business Name *" className="md:col-span-2">
                <input
                  type="text"
                  required={contactKind === "business"}
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className={inputClasses}
                  placeholder="Stewart Title, ABC Plumbing..."
                />
              </Field>
            )}

            {contactKind === "person" && (
              <Field label="Last Name *">
                <input
                  type="text"
                  required={contactKind === "person"}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className={inputClasses}
                />
              </Field>
            )}

            <Field
              className={contactKind === "business" ? "md:col-span-2" : ""}
              label="Email Address"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Primary Phone">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <select
                  value={cellPhoneType}
                  onChange={(e) => setCellPhoneType(e.target.value)}
                  className={inputClasses}
                >
                  <option value="mobile">Mobile</option>
                  <option value="work">Work</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="tel"
                  value={cellPhone}
                  onChange={(e) => setCellPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className={inputClasses}
                />
              </div>
            </Field>

            <Field className="md:col-span-2" label="Secondary Phone">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <select
                  value={businessPhoneType}
                  onChange={(event) => setBusinessPhoneType(event.target.value)}
                  className={inputClasses}
                >
                  <option value="mobile">Mobile</option>
                  <option value="work">Work</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(event) => setBusinessPhone(event.target.value)}
                  placeholder="Enter phone number"
                  className={inputClasses}
                />
              </div>
            </Field>
          </FormSection>

          {/* Spouse Information */}
          {contactKind === "person" && (
            <FormSection
              description="Optional contact and communication information for the contact's spouse."
              eyebrow="Household Relationship"
              title="Spouse Information"
            >
              <Field label="Spouse First Name">
                <input
                  type="text"
                  value={spouseFirstName}
                  onChange={(event) => setSpouseFirstName(event.target.value)}
                  className={inputClasses}
                />
              </Field>

              <Field label="Spouse Last Name">
                <input
                  type="text"
                  value={spouseLastName}
                  onChange={(event) => setSpouseLastName(event.target.value)}
                  className={inputClasses}
                />
              </Field>

              <Field label="Spouse Email">
                <input
                  type="email"
                  value={spouseEmail}
                  onChange={(event) => setSpouseEmail(event.target.value)}
                  className={inputClasses}
                />
              </Field>

              <Field label="Spouse Primary Phone">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <select
                    value={spouseCellPhoneType}
                    onChange={(event) => setSpouseCellPhoneType(event.target.value)}
                    className={inputClasses}
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="tel"
                    value={spouseCellPhone}
                    onChange={(event) => setSpouseCellPhone(event.target.value)}
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>
              </Field>

              <Field className="md:col-span-2" label="Spouse Secondary Phone">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <select
                    value={spouseBusinessPhoneType}
                    onChange={(event) => setSpouseBusinessPhoneType(event.target.value)}
                    className={inputClasses}
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="tel"
                    value={spouseBusinessPhone}
                    onChange={(event) => setSpouseBusinessPhone(event.target.value)}
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>
              </Field>
            </FormSection>
          )}

          {/* CRM Classification */}
          <FormSection
            description="Categorize this contact for filtering, workflows, marketing, and future RoseVault automations."
            eyebrow="Relationship Intelligence"
            title="CRM Classification"
          >
            <Field label="Contact Type">
              <select
                value={contactType}
                onChange={(event) => setContactType(event.target.value)}
                className={inputClasses}
              >
                <option value="lead">Lead</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="investor">Investor</option>
                <option value="title_rep">Title Rep</option>
                <option value="agent">Agent</option>
                <option value="lender">Lender</option>
                <option value="attorney">Attorney</option>
                <option value="contractor">Contractor</option>
                <option value="vendor">Vendor</option>
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClasses}
              >
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="nurture">Nurture</option>
                <option value="inactive">Inactive</option>
                <option value="past_client">Past Client</option>
                <option value="do_not_contact">Do Not Contact</option>
              </select>
            </Field>

            <Field label="Lead Source">
              <input
                type="text"
                value={leadSource}
                onChange={(event) => setLeadSource(event.target.value)}
                placeholder="Referral, website, Facebook, open house..."
                className={inputClasses}
              />
            </Field>

            <Field label="Preferred Contact Method">
              <select
                value={preferredContactMethod}
                onChange={(event) => setPreferredContactMethod(event.target.value)}
                className={inputClasses}
              >
                <option value="">Not specified</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text message</option>
              </select>
            </Field>
          </FormSection>

          {/* Company / Professional Information */}
          <FormSection
            description={
              contactKind === "business"
                ? "Primary contact details for this business."
                : "Primary professional or organizational details."
            }
            eyebrow="Professional Profile"
            title={contactKind === "business" ? "Primary Contact Details" : "Company Information"}
          >
            {contactKind === "business" ? (
              <>
                <Field label="Primary Contact First Name">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className={inputClasses}
                  />
                </Field>

                <Field label="Primary Contact Last Name">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className={inputClasses}
                  />
                </Field>

                <Field className="md:col-span-2" label="Primary Contact Title">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    placeholder="Account Manager, Owner, Closing Officer..."
                    className={inputClasses}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Employer">
                  <input
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className={inputClasses}
                  />
                </Field>

                <Field label="Job Title">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    className={inputClasses}
                  />
                </Field>
              </>
            )}
          </FormSection>

          {/* Mailing Address */}
          <FormSection
            description="Used for client records, correspondence, and mailing-label generation."
            eyebrow="Correspondence"
            title="Mailing Address"
          >
            <Field className="md:col-span-2" label="Address Line 1">
              <input
                type="text"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field className="md:col-span-2" label="Address Line 2">
              <input
                type="text"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="City">
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="State">
              <input
                type="text"
                value={state}
                onChange={(event) => setState(event.target.value)}
                maxLength={2}
                className={`${inputClasses} uppercase`}
              />
            </Field>

            <Field label="ZIP / Postal Code">
              <input
                type="text"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                className={inputClasses}
              />
            </Field>
          </FormSection>

          {/* Property Address */}
          <FormSection
            description="The property associated with this contact or real estate lead. This may be different from the contact's mailing address."
            eyebrow="Real Estate Relationship"
            title="Property Address"
          >
            <Field className="md:col-span-2" label="Property Address Line 1">
              <input
                type="text"
                value={propertyAddressLine1}
                onChange={(event) => setPropertyAddressLine1(event.target.value)}
                placeholder="123 Main Street"
                className={inputClasses}
              />
            </Field>

            <Field className="md:col-span-2" label="Property Address Line 2">
              <input
                type="text"
                value={propertyAddressLine2}
                onChange={(event) => setPropertyAddressLine2(event.target.value)}
                placeholder="Unit, suite, apartment, etc."
                className={inputClasses}
              />
            </Field>

            <Field label="City">
              <input
                type="text"
                value={propertyCity}
                onChange={(event) => setPropertyCity(event.target.value)}
                placeholder="Birmingham"
                className={inputClasses}
              />
            </Field>

            <Field label="State">
              <input
                type="text"
                value={propertyState}
                onChange={(event) => setPropertyState(event.target.value)}
                placeholder="AL"
                maxLength={2}
                className={`${inputClasses} uppercase`}
              />
            </Field>

            <Field label="ZIP / Postal Code">
              <input
                type="text"
                value={propertyPostalCode}
                onChange={(event) => setPropertyPostalCode(event.target.value)}
                placeholder="35203"
                className={inputClasses}
              />
            </Field>
          </FormSection>

          {/* Notes */}
          <FormSection
            description="Add or update anything important about this relationship."
            eyebrow="Relationship Context"
            isFullWidth={true}
            title="Notes"
          >
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Add key details, preferences, conversation notes, or background context..."
              className={inputClasses}
            />
          </FormSection>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link className={secondaryButtonClasses} href={`/contacts/${contactId}`}>
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClasses}
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}