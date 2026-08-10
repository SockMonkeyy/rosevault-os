"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "../components/auth/GoogleIcon";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSignIn(event: FormEvent) {
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

  async function handleGoogleSignIn() {
    setMessage("");
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF7EF] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        {/* Header & Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/RoseVaultLogo.png"
            alt="Rose Key Realty Co. logo"
            width={450}
            height={450}
            priority
            className="h-auto max-w-[240px] object-contain"
          />

          <h1 className="mt-4 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
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
              disabled={isLoading || isGoogleLoading}
              className="mt-2 w-full rounded-xl bg-[#B7832F] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#966822] focus:outline-none focus:ring-2 focus:ring-[#B7832F]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[#EDE7DC]" />

            <span className="mx-4 text-xs uppercase tracking-[0.12em] text-[#8F8578]">
              or
            </span>

            <div className="flex-1 border-t border-[#EDE7DC]" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E3DCD0] bg-white px-4 text-sm font-medium text-[#29231D] shadow-sm transition duration-300 hover:bg-[#FBF7EF] hover:border-[#D8B66A] focus:outline-none focus:ring-2 focus:ring-[#D8B66A]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <span>Connecting to Google...</span>
            ) : (
              <>
                <GoogleIcon size={18} />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Create Account */}
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