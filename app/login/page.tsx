"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";


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
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/rosevaultlogo.png"
              alt="Rose Key Realty Co. logo"
              width={450}
              height={450}
              priority
              className="h-auto w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#d4af37]">
            Real Estate Command Center
          </h1>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold">Welcome back</h2>

          <p className="mt-2 text-sm text-gray-400">
            Sign in to manage your real estate business.
          </p>

          <form onSubmit={handleSignIn} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
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
                className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
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
              disabled={isLoading}
              className="w-full rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account yet?{" "}
            <a
              href="/signup"
              className="font-medium text-[#d4af37] hover:underline"
            >
              Create account
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Secure access to your real estate command center.
        </p>
      </div>
    </main>
  );
}