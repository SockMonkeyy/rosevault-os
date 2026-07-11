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
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        <p className="text-gray-400">Loading your workspace...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🌹🔑</div>

          <h1 className="text-3xl font-bold tracking-tight text-[#d4af37]">
            ROSE KEY OS
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Let&apos;s set up your workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold">
            Create your command center
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Confirm your information below. Your organization will have its own
            secure workspace inside Rose Key OS.
          </p>

          <form onSubmit={handleOnboarding} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  First name
                </label>

                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Last name
                </label>

                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="mb-2 block text-sm font-medium text-gray-300"
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
                className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]"
              />
            </div>

            {message && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
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