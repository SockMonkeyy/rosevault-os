"use client";

import { useTransition } from "react";

import { signInWithGoogle } from "@/app/actions/auth/signInWithGoogle";

export default function GoogleSignInButton() {
  const [pending, startTransition] =
    useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await signInWithGoogle();
        })
      }
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#EDE7DC] bg-white px-4 py-3 text-sm font-medium transition hover:bg-[#FBF7EF]"
    >
      <img
        src="/google.svg"
        alt="Google"
        className="h-5 w-5"
      />

      {pending
        ? "Connecting..."
        : "Continue with Google"}
    </button>
  );
}