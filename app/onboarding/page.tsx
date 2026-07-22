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
      setMessage("Please enter a valid organization name.");
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
      <main className="flex min-h-screen items-center justify-center bg-[#0D0C0A] text-[#FBF7EF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D8B66A] border-t-transparent" />
          <p className="text-sm tracking-wide text-[#8F8578]">
            Loading your workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D0C0A] px-6 py-12 text-[#FBF7EF]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl">🌹🔑</div>

          <h1 className="font-serif text-3xl tracking-wide text-[#D8B66A]">
            ROSE KEY OS
          </h1>

          <p className="mt-2 text-sm text-[#8F8578]">
            Let&apos;s set up your workspace.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-[#29231D] bg-[#161412] p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="font-serif text-2xl text-[#FBF7EF]">
            Create your command center
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#8F8578]">
            Confirm your information below. Your organization will have its own
            secure workspace inside Rose Key OS.
          </p>

          <form onSubmit={handleOnboarding} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8F8578]"
                >
                  First name
                </label>

                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl border border-[#29231D] bg-[#0D0C0A] px-4 py-3 text-[#FBF7EF] placeholder-[#8F8578] outline-none transition focus:border-[#D8B66A] focus:ring-1 focus:ring-[#D8B66A]"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8F8578]"
                >
                  Last name
                </label>

                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-xl border border-[#29231D] bg-[#0D0C0A] px-4 py-3 text-[#FBF7EF] placeholder-[#8F8578] outline-none transition focus:border-[#D8B66A] focus:ring-1 focus:ring-[#D8B66A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8F8578]"
              >
                Company or organization name
              </label>

              <input
                id="organizationName"
                type="text"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Rose Key Realty Co."
                className="w-full rounded-xl border border-[#29231D] bg-[#0D0C0A] px-4 py-3 text-[#FBF7EF] placeholder-[#5C554B] outline-none transition focus:border-[#D8B66A] focus:ring-1 focus:ring-[#D8B66A]"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#D8B66A] px-4 py-3.5 font-medium text-[#0D0C0A] transition hover:bg-[#B7832F] hover:text-[#FBF7EF] disabled:cursor-not-allowed disabled:opacity-60"
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