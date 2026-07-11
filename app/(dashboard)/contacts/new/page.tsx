"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  const [spouseFirstName, setSpouseFirstName] = useState("");
  const [spouseLastName, setSpouseLastName] = useState("");
  const [spouseEmail, setSpouseEmail] = useState("");
  const [spouseCellPhone, setSpouseCellPhone] = useState("");
  const [spouseBusinessPhone, setSpouseBusinessPhone] = useState("");

  const [contactType, setContactType] = useState("lead");
  const [status, setStatus] = useState("active");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [notes, setNotes] = useState("");

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
      setMessage("We could not find your RoseVault organization workspace.");
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("contacts").insert({
      organization_id: membership.organization_id,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
      cell_phone: cellPhone.trim() || null,
      business_phone: businessPhone.trim() || null,

      spouse_first_name: spouseFirstName.trim() || null,
      spouse_last_name: spouseLastName.trim() || null,
      spouse_email: spouseEmail.trim() || null,
      spouse_cell_phone: spouseCellPhone.trim() || null,
      spouse_business_phone: spouseBusinessPhone.trim() || null,

      contact_type: contactType,
      status,
      company: company.trim() || null,
      job_title: jobTitle.trim() || null,
      mailing_address_line_1: addressLine1.trim() || null,
      mailing_address_line_2: addressLine2.trim() || null,
      mailing_city: city.trim() || null,
      mailing_state: state.trim() || null,
      mailing_postal_code: postalCode.trim() || null,
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
            relationship to RoseVault OS.
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
                  onChange={(event) => setFirstName(event.target.value)}
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
                  onChange={(event) => setLastName(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="cellPhone" className={labelClasses}>
                  Cell phone
                </label>

                <input
                  id="cellPhone"
                  type="tel"
                  value={cellPhone}
                  onChange={(event) => setCellPhone(event.target.value)}
                  placeholder="(205) 555-1234"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="businessPhone" className={labelClasses}>
                  Business phone
                </label>

                <input
                  id="businessPhone"
                  type="tel"
                  value={businessPhone}
                  onChange={(event) => setBusinessPhone(event.target.value)}
                  placeholder="(205) 555-5678"
                  className={inputClasses}
                />
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
                buying, selling, or investment process.
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
                  onChange={(event) => setSpouseFirstName(event.target.value)}
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
                  onChange={(event) => setSpouseLastName(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="spouseEmail" className={labelClasses}>
                  Email address
                </label>

                <input
                  id="spouseEmail"
                  type="email"
                  value={spouseEmail}
                  onChange={(event) => setSpouseEmail(event.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="spouseCellPhone" className={labelClasses}>
                  Cell phone
                </label>

                <input
                  id="spouseCellPhone"
                  type="tel"
                  value={spouseCellPhone}
                  onChange={(event) => setSpouseCellPhone(event.target.value)}
                  placeholder="(205) 555-1234"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="spouseBusinessPhone" className={labelClasses}>
                  Business phone
                </label>

                <input
                  id="spouseBusinessPhone"
                  type="tel"
                  value={spouseBusinessPhone}
                  onChange={(event) =>
                    setSpouseBusinessPhone(event.target.value)
                  }
                  placeholder="(205) 555-5678"
                  className={inputClasses}
                />
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
              </div>

              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>

                <select
                  id="status"
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
              </div>

              <div>
                <label htmlFor="leadSource" className={labelClasses}>
                  Lead source
                </label>

                <input
                  id="leadSource"
                  type="text"
                  value={leadSource}
                  onChange={(event) => setLeadSource(event.target.value)}
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
                  onChange={(event) => setCompany(event.target.value)}
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
                  onChange={(event) => setJobTitle(event.target.value)}
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
                  onChange={(event) => setAddressLine1(event.target.value)}
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
                  onChange={(event) => setAddressLine2(event.target.value)}
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
                  onChange={(event) => setCity(event.target.value)}
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
                  onChange={(event) => setState(event.target.value)}
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
                  onChange={(event) => setPostalCode(event.target.value)}
                  className={inputClasses}
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
              onChange={(event) => setNotes(event.target.value)}
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
