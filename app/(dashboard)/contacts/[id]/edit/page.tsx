"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const contactId = params.id;

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
  const [spouseBusinessPhoneType, setSpouseBusinessPhoneType] =
    useState("work");

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

      setFirstName(contact.first_name ?? "");
      setLastName(contact.last_name ?? "");
      setEmail(contact.email ?? "");
      setCellPhone(contact.cell_phone ?? contact.phone ?? "");
      setBusinessPhone(contact.business_phone ?? "");
      setCellPhoneType(contact.cell_phone_type ?? "mobile");
      setBusinessPhoneType(contact.business_phone_type ?? "work");

      setContactType(contact.contact_type ?? "lead");
      setStatus(contact.status ?? "active");
      setLeadSource(contact.lead_source ?? "");
      setPreferredContactMethod(contact.preferred_contact_method ?? "");

      setCompany(contact.company ?? "");
      setJobTitle(contact.job_title ?? "");

      setSpouseFirstName(contact.spouse_first_name ?? "");
      setSpouseLastName(contact.spouse_last_name ?? "");
      setSpouseEmail(contact.spouse_email ?? "");
      setSpouseCellPhone(contact.spouse_cell_phone ?? "");
      setSpouseCellPhoneType(contact.spouse_cell_phone_type ?? "mobile");

      setSpouseBusinessPhone(contact.spouse_business_phone ?? "");
      setSpouseBusinessPhoneType(contact.spouse_business_phone_type ?? "work");

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
      setMessage("We could not find your RoseVault organization workspace.");
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        email: email.trim() || null,
        cell_phone: cellPhone.trim() || null,
        cell_phone_type: cellPhoneType,

        business_phone: businessPhone.trim() || null,
        business_phone_type: businessPhoneType,

        contact_type: contactType,
        status,
        lead_source: leadSource.trim() || null,
        preferred_contact_method: preferredContactMethod || null,

        company: company.trim() || null,
        job_title: jobTitle.trim() || null,

        spouse_first_name: spouseFirstName.trim() || null,
        spouse_last_name: spouseLastName.trim() || null,
        spouse_email: spouseEmail.trim() || null,
        spouse_cell_phone: spouseCellPhone.trim() || null,
        spouse_cell_phone_type: spouseCellPhoneType,

        spouse_business_phone: spouseBusinessPhone.trim() || null,
        spouse_business_phone_type: spouseBusinessPhoneType,

        mailing_address_line_1: addressLine1.trim() || null,
        mailing_address_line_2: addressLine2.trim() || null,
        mailing_city: city.trim() || null,
        mailing_state: state.trim() || null,
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

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

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
            href={`/contacts/${contactId}`}
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Back to Contact
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Relationship Record
            </p>

            <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              Edit Contact
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
            eyebrow="Primary Record"
            title="Basic Information"
            description="Update the contact's primary information and communication details."
          >
            <Field label="First Name *">
              <input
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Last Name">
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Email Address">
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
                  onChange={(event) => setCellPhoneType(event.target.value)}
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
                  onChange={(event) => setCellPhone(event.target.value)}
                  placeholder="Enter phone number"
                  className={inputClasses}
                />
              </div>
            </Field>

            <Field label="Secondary Phone">
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
          <FormSection
            eyebrow="Household Relationship"
            title="Spouse Information"
            description="Optional contact and communication information for the contact's spouse."
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
                  onChange={(event) =>
                    setSpouseCellPhoneType(event.target.value)
                  }
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

            <Field label="Spouse Secondary Phone">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <select
                  value={spouseBusinessPhoneType}
                  onChange={(event) =>
                    setSpouseBusinessPhoneType(event.target.value)
                  }
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
                  onChange={(event) =>
                    setSpouseBusinessPhone(event.target.value)
                  }
                  placeholder="Enter phone number"
                  className={inputClasses}
                />
              </div>
            </Field>
          </FormSection>

          {/* CRM Classification */}
          <FormSection
            eyebrow="Relationship Intelligence"
            title="CRM Classification"
            description="Categorize this contact for filtering, workflows, marketing, and future RoseVault automations."
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
                onChange={(event) =>
                  setPreferredContactMethod(event.target.value)
                }
                className={inputClasses}
              >
                <option value="">Not specified</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text message</option>
              </select>
            </Field>
          </FormSection>

          {/* Company Information */}
          <FormSection
            eyebrow="Professional Profile"
            title="Company Information"
            description="Optional professional, business, or organizational details."
          >
            <Field label="Company">
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
          </FormSection>

          {/* Mailing Address */}
          <FormSection
            eyebrow="Correspondence"
            title="Mailing Address"
            description="Used for client records, correspondence, and mailing-label generation."
          >
            <div className="md:col-span-2">
              <label className={labelClasses}>Address Line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Address Line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                className={inputClasses}
              />
            </div>

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
                className={inputClasses}
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
            eyebrow="Real Estate Relationship"
            title="Property Address"
            description="The property associated with this contact or real estate lead. This may be different from the contact's mailing address."
          >
            <div className="md:col-span-2">
              <label className={labelClasses}>Property Address Line 1</label>
              <input
                type="text"
                value={propertyAddressLine1}
                onChange={(event) =>
                  setPropertyAddressLine1(event.target.value)
                }
                placeholder="123 Main Street"
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Property Address Line 2</label>
              <input
                type="text"
                value={propertyAddressLine2}
                onChange={(event) =>
                  setPropertyAddressLine2(event.target.value)
                }
                placeholder="Unit, suite, apartment, etc."
                className={inputClasses}
              />
            </div>

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
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Relationship Context
              </p>

              <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                Notes
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
                Add or update anything important about this relationship.
              </p>
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Add notes about this contact..."
              className={inputClasses}
            />
          </section>

          {/* Bottom Error Message */}
          {message && (
            <div className="rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700">
              {message}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EDE7DC]/80 pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/contacts/${contactId}`}
              className={secondaryButtonClasses}
            >
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

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
          {eyebrow}
        </p>

        <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#7C7265]">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
      </label>

      {children}
    </div>
  );
}