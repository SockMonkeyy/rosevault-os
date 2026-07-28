"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      const metadata = user.user_metadata;

      setFirstName(metadata?.first_name ?? "");
      setLastName(metadata?.last_name ?? "");
      setOrganizationName(metadata?.organization_name ?? "");

      setIsLoadingUser(false);
    }

    loadUser();
  }, [supabase]);

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    const baseSlug = createSlug(organizationName);

    if (!baseSlug) {
      setMessage("Organization name is required.");
      setIsSubmitting(false);
      return;
    }

    const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const { error } = await supabase.rpc(
      "create_organization_for_current_user",
      {
        organization_name: organizationName,
        organization_slug: uniqueSlug,
        first_name: firstName,
        last_name: lastName,
      }
    );

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/";
  }

  if (isLoadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF7EF] text-[#29231D]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B7832F] border-t-transparent" />
          <p className="text-sm tracking-wide text-[#8F8578]">
            Loading your workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF7EF] px-6 py-12 text-[#29231D]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl">🌹🔑</div>

          <h1 className="font-serif text-3xl tracking-wide text-[#29231D]">
            ROSE KEY OS
          </h1>

          <p className="mt-1.5 font-serif text-sm italic tracking-wide text-[#8F8578]">
            &ldquo;Where Every Home Blooms with Possibility&rdquo;
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#EDE7DC] bg-white/80 p-8 shadow-xl shadow-[#29231D]/5 backdrop-blur-sm">
          <h2 className="font-serif text-2xl font-normal text-[#29231D]">
            Confirm your workspace details
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#7C7265]">
            Review your information below. Your organization will have its own
            secure workspace inside Rose Key OS.
          </p>

          <form onSubmit={handleOnboarding} className="mt-8 space-y-5">
            <div className="rounded-xl border border-[#EDE7DC] bg-[#FBF7EF]/50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8F8578] font-medium uppercase tracking-wider text-xs">Name</span>
                <span className="text-[#29231D] font-medium">{firstName} {lastName}</span>
              </div>
              <hr className="border-[#EDE7DC]" />
              <div className="flex justify-between text-sm">
                <span className="text-[#8F8578] font-medium uppercase tracking-wider text-xs">Organization</span>
                <span className="text-[#29231D] font-medium">{organizationName || "Not provided"}</span>
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#B7832F] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#966822] focus:outline-none focus:ring-2 focus:ring-[#B7832F]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating your workspace..."
                : "Create my workspace"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}