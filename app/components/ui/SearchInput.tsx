// app/components/ui/SearchInput.tsx
import React, { InputHTMLAttributes } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function SearchInput({ className = "", ...props }: SearchInputProps) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        className={`w-full rounded-xl border border-[#EDE7DC] bg-white py-3 pl-11 pr-4 text-sm text-[#29231D] placeholder-[#8F8578] outline-none transition focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/20 ${className}`}
        {...props}
      />
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8578]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </div>
  );
}