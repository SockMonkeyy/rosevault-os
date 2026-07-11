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
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            {editingId ? "Edit Template" : "New Template"}
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            {editingId
              ? "Update Email Template"
              : "Create Email Template"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
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
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Category
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
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
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Subject Line
            </label>

            <input
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              placeholder="Example: Following up about your property"
              className={inputClasses}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-medium text-gray-300">
                Message
              </label>

              <span className="text-xs text-gray-600">
                Personalization supported
              </span>
            </div>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              placeholder={`Hi {{first_name}},\n\nThank you for connecting with Rose Key Realty Co...`}
              className={inputClasses}
            />

            <div className="mt-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                Insert Personalization
              </p>

              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1.5 text-xs text-gray-400 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {message && (
            <div className="rounded-lg border border-[#333333] bg-[#111111] px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              Saved Templates
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Template Library
            </h2>
          </div>

          <span className="text-sm text-gray-500">
            {templates.length} total
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#333333] p-8 text-center">
            <p className="font-medium text-white">
              No templates yet
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Create your first reusable email template using
              the form.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 text-xs text-[#d4af37]">
                      {formatLabel(template.category)}
                    </span>

                    <h3 className="mt-3 font-semibold text-white">
                      {template.name}
                    </h3>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {template.subject}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-gray-500">
                  {template.body}
                </p>

                <div className="mt-5 flex gap-3 border-t border-[#2a2a2a] pt-4">
                  <button
                    type="button"
                    onClick={() => startEditing(template)}
                    className="text-sm text-[#d4af37] transition hover:text-[#e2c35b]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTemplate(template)}
                    className="text-sm text-gray-600 transition hover:text-red-400"
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