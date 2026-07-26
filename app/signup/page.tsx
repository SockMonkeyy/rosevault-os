"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data?.session) {
        setMessage(
          "Account created. Check your email to confirm your account, then sign in.",
        );
        return;
      }

      window.location.href = "/onboarding";
    } catch (err) {
      console.error("Unexpected signup error:", err);
      setMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF7EF] px-6 py-12 text-[#29231D]">
      <div className="w-full max-w-md">
        {/* Header & Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/RoseVaultLogo.png"
              alt="Rose Key Realty Co. logo"
              width={450}
              height={450}
              priority
              className="h-auto max-w-[240px] object-contain"
            />
          </div>

          <h1 className="font-serif text-2xl font-normal tracking-wide text-[#29231D]">
            ROSE KEY OS
          </h1>

          <p className="mt-1.5 font-serif text-sm italic tracking-wide text-[#8F8578]">
            &ldquo;Where Every Home Blooms with Possibility&rdquo;
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#EDE7DC] bg-white/80 p-8 shadow-xl shadow-[#29231D]/5 backdrop-blur-sm">
          <h2 className="font-serif text-2xl font-normal text-[#29231D]">
            Create your account
          </h2>

          <p className="mt-2 text-sm text-[#7C7265]">
            Start building your real estate command center.
          </p>

          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
                >
                  First name
                </label>

                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
                >
                  Last name
                </label>

                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
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
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-[#B7832F]/30 bg-[#FBF7EF] px-4 py-3 text-sm text-[#966822]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl bg-[#B7832F] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#966822] focus:outline-none focus:ring-2 focus:ring-[#B7832F]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#7C7265]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#B7832F] transition hover:text-[#966822] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#8F8578]">
          Secure access to your real estate command center.
        </p>
      </div>
    </main>
  );
}
