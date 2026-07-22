"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF7EF] px-6 py-12 text-[#29231D]">
      <div className="w-full max-w-md">
        {/* Header & Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/rosevaultlogo.png"
              alt="Rose Key Realty Co. logo"
              width={450}
              height={450}
              priority
              className="h-auto max-w-[240px] object-contain"
            />
          </div>

          <h1 className="font-serif text-2xl font-normal tracking-wide text-[#29231D]">
            Real Estate Command Center
          </h1>

          <p className="mt-1.5 font-serif text-sm italic tracking-wide text-[#8F8578]">
            &ldquo;Where Every Home Blooms with Possibility&rdquo;
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#EDE7DC] bg-white/80 p-8 shadow-xl shadow-[#29231D]/5 backdrop-blur-sm">
          <h2 className="font-serif text-2xl font-normal text-[#29231D]">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-[#7C7265]">
            Sign in to manage your real estate business.
          </p>

          <form onSubmit={handleSignIn} className="mt-8 space-y-5">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm text-[#29231D] placeholder-[#8F8578] outline-none shadow-sm transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl bg-[#B7832F] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#966822] focus:outline-none focus:ring-2 focus:ring-[#B7832F]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#7C7265]">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#B7832F] transition hover:text-[#966822] hover:underline"
            >
              Create account
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