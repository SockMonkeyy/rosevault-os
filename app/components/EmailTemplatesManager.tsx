"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  organizationId: string;
  userId: string;
  initialTemplates: EmailTemplate[];
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "lead_follow_up", label: "Lead Follow-Up" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "investor", label: "Investor" },
  { value: "transaction", label: "Transaction" },
  { value: "marketing", label: "Marketing" },
];

const VARIABLES = [
  "{{first_name}}",
  "{{last_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{mailing_address}}",
  "{{property_address}}",
];

export default function EmailTemplatesManager({
  organizationId,
  userId,
  initialTemplates,
}: Props) {
  const [templates, setTemplates] =
    useState<EmailTemplate[]>(initialTemplates);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setName("");
    setSubject("");
    setBody("");
    setCategory("general");
  }

  function startEditing(template: EmailTemplate) {
    setEditingId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setCategory(template.category);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function insertVariable(variable: string) {
    setBody((current) => `${current}${variable}`);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim() || !subject.trim() || !body.trim()) {
      setMessage(
        "Template name, subject, and message are required."
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    const supabase = createClient();

    const payload = {
      organization_id: organizationId,
      created_by: userId,
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      category,
      is_active: true,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          name: payload.name,
          subject: payload.subject,
          body: payload.body,
          category: payload.category,
        })
        .eq("id", editingId)
        .eq("organization_id", organizationId)
        .select(`
          id,
          name,
          subject,
          body,
          category,
          is_active,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      setTemplates((current) =>
        current.map((template) =>
          template.id === data.id ? data : template
        )
      );

      setMessage("Template updated successfully.");
    } else {
      const { data, error } = await supabase
        .from("email_templates")
        .insert(payload)
        .select(`
          id,
          name,
          subject,
          body,
          category,
          is_active,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      setTemplates((current) => [data, ...current]);
      setMessage("Template created successfully.");
    }

    resetForm();
    setIsSaving(false);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  async function deleteTemplate(template: EmailTemplate) {
    const confirmed = window.confirm(
      `Permanently delete the template "${template.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", template.id)
      .eq("organization_id", organizationId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTemplates((current) =>
      current.filter((item) => item.id !== template.id)
    );

    setMessage("Template deleted successfully.");

    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

    const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0D0C0A] disabled:hover:text-[#D8B66A] disabled:hover:shadow-none";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
      {/* Create / Edit Template */}
      <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            {editingId ? "Edit Template" : "New Template"}
          </p>

          <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
            {editingId
              ? "Update Email Template"
              : "Create Email Template"}
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#7C7265]">
            {editingId
              ? "Refine your saved template, subject line, message, category, and personalization."
              : "Build a reusable message for leads, clients, transactions, follow-ups, and marketing campaigns."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClasses}>
              Template Name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: New Seller Lead Follow-Up"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>
              Category
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClasses}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>
              Subject Line
            </label>

            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: Following up about your property"
              className={inputClasses}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                Message
              </label>

              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A89C8D]">
                Personalization Supported
              </span>
            </div>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              placeholder={`Hi {{first_name}},\n\nThank you for connecting with Rose Key Realty Co...`}
              className={`${inputClasses} resize-y leading-7`}
            />

            <div className="mt-4">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                Insert Personalization
              </p>

              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="cursor-pointer rounded-full border border-[#E3DCD0] bg-white/60 px-3 py-1.5 text-[10px] font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md border px-4 py-3 text-xs leading-relaxed ${
                message.toLowerCase().includes("success")
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
                  : "border-red-200 bg-red-50/70 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#EDE7DC]/80 pt-5 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className={`${primaryButtonClasses} flex-1`}
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Template"
                  : "Create Template"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className={secondaryButtonClasses}
              >
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Template Library */}
      <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Saved Templates
            </p>

            <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              Template Library
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
              Reuse, edit, and manage your saved RoseVault communications.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
            {templates.length} total
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 p-8 text-center">
            <p className="font-serif text-sm font-medium tracking-wide text-[#29231D]">
              No templates yet
            </p>

            <p className="mt-2 text-xs leading-6 text-[#8F8578]">
              Create your first reusable email template using the form.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="group rounded-xl border border-[#EDE7DC] bg-white/45 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
                      {formatLabel(template.category)}
                    </span>

                    <h3 className="mt-3 font-serif text-sm font-medium tracking-wide text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
                      {template.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#8F8578]">
                      {template.subject}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 whitespace-pre-line text-xs leading-6 text-[#7C7265]">
                  {template.body}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EDE7DC]/80 pt-4">
                  <button
                    type="button"
                    onClick={() => startEditing(template)}
                    className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTemplate(template)}
                    className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#8F8578] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}