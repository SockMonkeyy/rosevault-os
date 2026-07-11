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
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  const labelClasses = "mb-2 block text-sm font-medium text-gray-300";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-400">Loading contact...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href={`/contacts/${contactId}`}
            className="mb-4 inline-block text-sm text-[#d4af37] hover:underline"
          >
            ← Back to Contact
          </Link>

          <h1 className="text-3xl font-semibold">Edit Contact</h1>

          <p className="mt-2 text-gray-400">
            Update contact details, CRM information, spouse information, mailing
            address, and notes.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection
            title="Basic Information"
            description="Update the contact's primary information."
          >
            <Field label="First name *">
              <input
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Last name">
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Email address">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Primary phone">
              <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
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

            <Field label="Secondary phone">
              <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
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

          <FormSection
            title="Spouse Information"
            description="Optional contact information for the contact's spouse."
          >
            <Field label="Spouse first name">
              <input
                type="text"
                value={spouseFirstName}
                onChange={(event) => setSpouseFirstName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Spouse last name">
              <input
                type="text"
                value={spouseLastName}
                onChange={(event) => setSpouseLastName(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Spouse email">
              <input
                type="email"
                value={spouseEmail}
                onChange={(event) => setSpouseEmail(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Spouse primary phone">
              <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
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

            <Field label="Spouse secondary phone">
              <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
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

          <FormSection
            title="CRM Classification"
            description="Categorize this contact for filtering, workflows, and future automations."
          >
            <Field label="Contact type">
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

            <Field label="Lead source">
              <input
                type="text"
                value={leadSource}
                onChange={(event) => setLeadSource(event.target.value)}
                placeholder="Referral, website, Facebook, open house..."
                className={inputClasses}
              />
            </Field>

            <Field label="Preferred contact method">
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

          <FormSection
            title="Company Information"
            description="Optional professional or business details."
          >
            <Field label="Company">
              <input
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label="Job title">
              <input
                type="text"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className={inputClasses}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Mailing Address"
            description="Used for client records and future mailing-label generation."
          >
            <div className="md:col-span-2">
              <label className={labelClasses}>Address line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Address line 2</label>
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

            <Field label="ZIP / Postal code">
              <input
                type="text"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                className={inputClasses}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Property Address"
            description="The address of the property associated with this contact or real estate lead. This may be different from the contact's mailing address."
          >
            <div className="md:col-span-2">
              <label className={labelClasses}>Property address line 1</label>
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
              <label className={labelClasses}>Property address line 2</label>
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

            <Field label="ZIP / Postal code">
              <input
                type="text"
                value={propertyPostalCode}
                onChange={(event) => setPropertyPostalCode(event.target.value)}
                placeholder="35203"
                className={inputClasses}
              />
            </Field>
          </FormSection>

          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Notes</h2>
              <p className="mt-1 text-sm text-gray-500">
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

          {message && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/contacts/${contactId}`}
              className="rounded-lg border border-[#333333] px-6 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving changes..." : "Save Changes"}
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
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
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
      <label className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}
