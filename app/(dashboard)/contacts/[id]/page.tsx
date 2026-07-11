import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactGroupsTags from "@/app/components/ContactGroupsTags";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (error || !contact) {
    notFound();
  }

  const [
    { data: groups },
    { data: tags },
    { data: groupMemberships },
    { data: tagAssignments },
  ] = await Promise.all([
    supabase
      .from("contact_groups")
      .select("id, name, description")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_tags")
      .select("id, name")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_group_memberships")
      .select("group_id")
      .eq("organization_id", membership.organization_id)
      .eq("contact_id", contact.id),

    supabase
      .from("contact_tag_assignments")
      .select("tag_id")
      .eq("organization_id", membership.organization_id)
      .eq("contact_id", contact.id),
  ]);

  const assignedGroupIds =
    groupMemberships?.map((membership) => membership.group_id) ?? [];

  const assignedTagIds =
    tagAssignments?.map((assignment) => assignment.tag_id) ?? [];

  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ");

  const spouseName = [contact.spouse_first_name, contact.spouse_last_name]
    .filter(Boolean)
    .join(" ");

  const mailingAddress = [
    contact.mailing_address_line_1,
    contact.mailing_address_line_2,
    contact.mailing_city,
    contact.mailing_state,
    contact.mailing_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  function formatPhoneType(type: string | null | undefined) {
    switch (type) {
      case "mobile":
        return "Mobile";
      case "work":
        return "Work";
      case "home":
        return "Home";
      case "other":
        return "Other";
      default:
        return "Phone";
    }
  }

  function formatAddress(
    line1: string | null | undefined,
    line2: string | null | undefined,
    city: string | null | undefined,
    state: string | null | undefined,
    postalCode: string | null | undefined,
  ) {
    const streetLines = [line1, line2].filter(Boolean);

    const cityStateZip = [city, [state, postalCode].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

    return [...streetLines, cityStateZip].filter(Boolean).join("\n");
  }

  const hasSpouseInfo = Boolean(
    contact.spouse_first_name ||
    contact.spouse_last_name ||
    contact.spouse_email ||
    contact.spouse_cell_phone ||
    contact.spouse_business_phone,
  );

  const hasPropertyAddress = Boolean(
    contact.property_address_line_1 ||
    contact.property_address_line_2 ||
    contact.property_city ||
    contact.property_state ||
    contact.property_postal_code,
  );

  const propertyAddress = formatAddress(
    contact.property_address_line_1,
    contact.property_address_line_2,
    contact.property_city,
    contact.property_state,
    contact.property_postal_code,
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/contacts"
          className="mb-5 inline-block text-sm text-[#d4af37] hover:underline"
        >
          ← Back to Contacts
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{fullName}</h1>

              <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs capitalize text-[#d4af37]">
                {contact.contact_type}
              </span>
            </div>

            <p className="text-gray-400">
              {contact.company || "Individual Contact"}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Edit Contact
            </Link>

            <button className="rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]">
              + Add Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold">Contact Information</h2>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoItem label="Email" value={contact.email} />
                <InfoItem
                  label={`Primary ${formatPhoneType(contact.cell_phone_type)}`}
                  value={contact.cell_phone}
                />

                <InfoItem
                  label={`Secondary ${formatPhoneType(contact.business_phone_type)}`}
                  value={contact.business_phone}
                />
                <InfoItem
                  label="Preferred Contact Method"
                  value={contact.preferred_contact_method}
                />
              </div>
            </section>

            {spouseName && (
              <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
                <h2 className="text-xl font-semibold">Spouse Information</h2>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InfoItem label="Name" value={spouseName} />
                  <InfoItem label="Email" value={contact.spouse_email} />
                  <InfoItem
                    label="Cell Phone"
                    value={contact.spouse_cell_phone}
                  />
                  <InfoItem
                    label="Business Phone"
                    value={contact.spouse_business_phone}
                  />
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold text-white">
                Mailing Address
              </h2>

              <div className="mt-6">
                <p className="mt-2 whitespace-pre-line text-white">
                  {formatAddress(
                    contact.mailing_address_line_1,
                    contact.mailing_address_line_2,
                    contact.mailing_city,
                    contact.mailing_state,
                    contact.mailing_postal_code,
                  ) || "—"}
                </p>
              </div>
            </section>

            {hasPropertyAddress && (
              <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
                <h2 className="text-xl font-semibold text-white">
                  Property Address
                </h2>

                <div className="mt-6">
                  <div>
                    <p className="mt-2 whitespace-pre-line text-white">
                      {propertyAddress || "—"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold">Notes</h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-400">
                {contact.notes || "No notes have been added yet."}
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
              <h2 className="text-xl font-semibold">CRM Details</h2>

              <div className="mt-6 space-y-5">
                <InfoItem label="Contact Type" value={contact.contact_type} />

                <InfoItem label="Status" value={contact.status} />

                <InfoItem label="Lead Source" value={contact.lead_source} />

                <InfoItem label="Job Title" value={contact.job_title} />
              </div>
            </section>

            <ContactGroupsTags
              contactId={contact.id}
              organizationId={membership.organization_id}
              groups={groups ?? []}
              tags={tags ?? []}
              assignedGroupIds={assignedGroupIds}
              assignedTagIds={assignedTagIds}
            />

            <section className="rounded-2xl border border-[#d4af37]/30 bg-[#151515] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                Rosie AI
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Contact Intelligence
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Rosie will eventually summarize conversations, identify
                follow-up opportunities, and recommend the next best action for
                this relationship.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>

      <p className="mt-2 capitalize text-gray-200">{value || "—"}</p>
    </div>
  );
}
