"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/app/components/LogoutButton";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Contacts", href: "/contacts" },
  { label: "Leads", href: "/leads" },
  { label: "Pipelines", href: "/pipelines" },
  { label: "Properties", href: "/properties" },
  { label: "Transactions", href: "/transactions" },
  { label: "Tasks", href: "/tasks" },
  { label: "Calendar", href: "/calendar" },
];

const marketingItems = [
  { label: "Bulk Email", href: "/email/compose" },
  { label: "Email Templates", href: "/email/templates" },
  { label: "Campaigns", href: "/marketing/campaigns" },
  { label: "Mailchimp", href: "/marketing/mailchimp" },
  { label: "Mailing Labels", href: "/marketing/mailing-labels" },
];

const bottomNavigationItems = [
  { label: "Documents", href: "/documents" },
  { label: "Rosie AI", href: "/rosie" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const marketingIsActive = marketingItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const [marketingOpen, setMarketingOpen] = useState(marketingIsActive);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const mainNavClasses = (active: boolean) =>
    `relative block w-full overflow-hidden rounded-md px-4 py-2 text-left text-sm tracking-wide transition-all duration-300 ${
      active
        ? "bg-[#B7832F]/12 font-medium text-[#D8B66A]"
        : "text-[#C4BCB1] hover:bg-[#171512] hover:text-[#EAE5DE]"
    }`;

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 select-none flex-col overflow-hidden border-r border-[#29231D] bg-[#0D0C0A] text-[#EAE5DE]">
      {/* Branding Header */}
      <div className="shrink-0 border-b border-[#29231D] bg-[#0A0908] px-6 py-5">
        <Link
          href="/"
          aria-label="Go to RoseVault dashboard"
          className="group block rounded-md transition-all duration-300"
        >
          <div className="relative mx-auto h-24 w-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-90">
            <Image
              src="/RoseVaultLogo.png"
              alt="RoseVault OS"
              fill
              priority
              sizes="248px"
              className="object-contain"
            />
          </div>
        </Link>

        <p className="mt-2 text-center text-[11px] leading-relaxed tracking-wide text-[#A89C8D]">
          The Operating System Behind
          <br />
          <span className="mt-0.5 block font-serif text-sm italic tracking-normal text-[#D8B66A]">
            Rose Key Realty Co.
          </span>
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {/* Main Navigation */}
        {navigationItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={mainNavClasses(active)}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#D8B66A]"
                />
              )}

              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}

        {/* Marketing Accordion */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setMarketingOpen((current) => !current)}
            aria-expanded={marketingOpen}
            className={`relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-4 py-2 text-left text-sm tracking-wide transition-all duration-300 ${
              marketingIsActive
                ? "bg-[#B7832F]/12 font-medium text-[#D8B66A]"
                : "text-[#C4BCB1] hover:bg-[#171512] hover:text-[#EAE5DE]"
            }`}
          >
            {marketingIsActive && (
              <span
                aria-hidden="true"
                className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#D8B66A]"
              />
            )}

            <span className="relative z-10">Marketing</span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className={`h-4 w-4 text-[#8F8578] transition-all duration-300 ${
                marketingOpen
                  ? "rotate-180 text-[#D8B66A]"
                  : ""
              }`}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              marketingOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="ml-4 mt-1 space-y-0.5 border-l border-[#29231D] pl-2">
                {marketingItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-md px-4 py-1.5 text-xs tracking-wide transition-all duration-300 ${
                        active
                          ? "bg-[#B7832F]/10 font-medium text-[#D8B66A]"
                          : "text-[#8F8578] hover:translate-x-0.5 hover:bg-[#171512]/60 hover:text-[#C4BCB1]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Navigation */}
        <div className="space-y-1 pt-4">
          {bottomNavigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={mainNavClasses(active)}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#D8B66A]"
                  />
                )}

                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-[#29231D] bg-[#070605] p-5">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#63594E]">
            Powered by
          </p>

          <p className="mt-0.5 font-serif text-sm italic tracking-wide text-[#A89C8D]">
            Rose Key Realty Co.
          </p>
        </div>

        <LogoutButton />
      </div>
    </aside>
  );
}