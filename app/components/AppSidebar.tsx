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

  const marketingIsActive = marketingItems.some((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const [marketingOpen, setMarketingOpen] = useState(marketingIsActive);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-hidden border-r border-[#2a2a2a] bg-[#111111]">
      {/* RoseVault Branding */}
      <div className="shrink-0 border-b border-[#2a2a2a] px-5 py-4">
        <Link
          href="/"
          className="block transition-opacity hover:opacity-90"
          aria-label="RoseVault OS Dashboard"
        >
          <div className="relative mx-auto h-28 w-full">
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

        <p className="mt-1 text-center text-xs leading-5 text-gray-400">
          The Operating System Behind
          <br />
          <span className="text-[#d4af37]">
            Rose Key Realty Co.
          </span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {/* Main Navigation */}
        {navigationItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-[#d4af37]/10 font-medium text-[#d4af37]"
                  : "text-gray-300 hover:bg-[#222222] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Marketing Dropdown */}
        <div>
          <button
            type="button"
            onClick={() => setMarketingOpen((current) => !current)}
            aria-expanded={marketingOpen}
            className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm transition ${
              marketingIsActive
                ? "bg-[#d4af37]/10 font-medium text-[#d4af37]"
                : "text-gray-300 hover:bg-[#222222] hover:text-white"
            }`}
          >
            <span>Marketing</span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${
                marketingOpen ? "rotate-180" : ""
              }`}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {marketingOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-[#333333] pl-3">
              {marketingItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-4 py-2 text-sm transition ${
                      active
                        ? "bg-[#d4af37]/10 font-medium text-[#d4af37]"
                        : "text-gray-500 hover:bg-[#222222] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {bottomNavigationItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-[#d4af37]/10 font-medium text-[#d4af37]"
                  : "text-gray-300 hover:bg-[#222222] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#2a2a2a] p-4">
        <p className="text-xs uppercase tracking-widest text-gray-600">
          Powered by
        </p>

        <p className="mt-1 font-serif text-sm text-[#d4af37]">
          Rose Key Realty Co.
        </p>

        <LogoutButton />
      </div>
    </aside>
  );
}