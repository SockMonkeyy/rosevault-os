"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type DnsRecord = {
  record?: string;
  purpose?: string;
  name?: string;
  type?: string;
  value?: string;
  ttl?: string;
  status?: string;
  priority?: number;
};

type DomainRecord = {
  id?: string;
  domain?: string;
  provider?: string;
  status?: string;
  dns_records?: DnsRecord[];
  verified_at?: string | null;
};

type DomainResponse = {
  success?: boolean;
  error?: string;
  domain?: DomainRecord;
};

type DomainsResponse = {
  success?: boolean;
  error?: string;
  domains?: DomainRecord[];
};

export default function EmailSettingsPage() {
  const [domain, setDomain] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [savedDomain, setSavedDomain] = useState<DomainRecord | null>(null);

  async function copyToClipboard(value: string, fieldId: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      setCopiedField(fieldId);

      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldId ? null : current));
      }, 2000);
    } catch (copyError) {
      console.error("Unable to copy DNS value:", copyError);

      setError(
        "We couldn't copy that DNS value. Please select and copy it manually.",
      );
    }
  }

  const [isVerifying, setIsVerifying] = useState(false);

  async function handleVerifyDomain() {
    if (!savedDomain?.id) {
      setError("We couldn't find the RoseVault domain record.");
      return;
    }

    setMessage("");
    setError("");
    setIsVerifying(true);

    try {
      const response = await fetch(
        `/api/email/domains/${savedDomain.id}/verify`,
        {
          method: "POST",
        },
      );

      const data: DomainResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "We couldn't verify the domain. Please check your DNS records and try again.",
        );
        return;
      }

      if (data.domain) {
        setSavedDomain(data.domain);
      }

      if (data.domain?.status === "verified") {
        setMessage(
          "Your domain has been verified and is ready for email sending.",
        );
      } else {
        setMessage(
          "Your domain is not verified yet. Please confirm the DNS records below and try again.",
        );
      }
    } catch (verificationError) {
      console.error("Verify domain request error:", verificationError);

      setError(
        "Something went wrong while checking your domain. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDomains() {
      setIsLoadingDomains(true);
      setError("");

      try {
        const response = await fetch("/api/email/domains", {
          method: "GET",
          cache: "no-store",
        });

        const data: DomainsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load email domains.");
        }

        if (!isMounted) {
          return;
        }

        const domains = Array.isArray(data.domains) ? data.domains : [];

        if (domains.length > 0) {
          setSavedDomain(domains[0]);
        } else {
          setSavedDomain(null);
        }
      } catch (loadError) {
        console.error("Load email domains error:", loadError);

        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your email domains.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingDomains(false);
        }
      }
    }

    loadDomains();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    /*
     * Prevent accidental duplicate creation.
     *
     * If a domain is already loaded, we don't send
     * another POST request to Postmark.
     */
    if (savedDomain) {
      setError(
        "A sending domain is already connected. Use the existing domain below instead of adding it again.",
      );
      return;
    }

    async function handleVerifyDomain() {
      if (!savedDomain?.id) {
        setError("We couldn't find the RoseVault domain record.");
        return;
      }

      setMessage("");
      setError("");
      setIsVerifying(true);

      try {
        const response = await fetch(
          `/api/email/domains/${savedDomain.id}/verify`,
          {
            method: "POST",
          },
        );

        const data: DomainResponse = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.error ||
              "We couldn't verify the domain. Please check your DNS records and try again.",
          );
          return;
        }

        if (data.domain) {
          setSavedDomain(data.domain);
        }

        if (data.domain?.status === "verified") {
          setMessage(
            "Your domain has been verified and is ready for email sending.",
          );
        } else {
          setMessage(
            "Your domain is not verified yet. Please confirm the DNS records below and try again.",
          );
        }
      } catch (verificationError) {
        console.error("Verify domain request error:", verificationError);

        setError(
          "Something went wrong while checking your domain. Please try again.",
        );
      } finally {
        setIsVerifying(false);
      }
    }

    const normalizedDomain = domain.trim().toLowerCase();

    if (!normalizedDomain) {
      setError("Please enter your sending domain.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/email/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: normalizedDomain,
        }),
      });

      const data: DomainResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "We could not add this email sending domain. Please try again.",
        );
        return;
      }

      setSavedDomain(data.domain ?? null);

      setMessage(
        "Your email domain was added successfully. Complete the DNS records below to verify it.",
      );

      setDomain("");
    } catch (requestError) {
      console.error("Email domain request error:", requestError);

      setError(
        "Something went wrong while adding your domain. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryButtonClasses =
    "inline-flex items-center justify-center rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm";

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/email/compose"
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Back to Email
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              Email Settings
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
              Configure the domains RoseVault will use when sending email on
              behalf of your business.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-6 rounded-md border border-[#D8B66A]/40 bg-[#D8B66A]/10 px-4 py-3 text-xs leading-relaxed text-[#6F5424]">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Add Domain */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/50 p-6 backdrop-blur-sm lg:p-8">
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Sending Identity
              </p>

              <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                {savedDomain
                  ? "Sending Domain Connected"
                  : "Add Your Sending Domain"}
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-[#7C7265]">
                {savedDomain
                  ? "Your RoseVault organization already has a sending domain connected. Complete its DNS verification below."
                  : "Add the domain you want RoseVault to use for outgoing email. After the domain is added, RoseVault will provide DNS records that need to be added to your domain provider."}
              </p>
            </div>

            {isLoadingDomains ? (
              <div className="flex items-center gap-3 rounded-md border border-[#EDE7DC] bg-[#FBF7EF] px-4 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E3DCD0] border-t-[#B7832F]" />

                <p className="text-xs text-[#7C7265]">
                  Checking your sending domains...
                </p>
              </div>
            ) : savedDomain ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E3DCD0] bg-[#FBF7EF] p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Connected Domain
                  </p>

                  <p className="mt-2 font-serif text-xl text-[#29231D]">
                    {savedDomain.domain}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    savedDomain.status === "verified"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-[#D8B66A]/40 bg-[#D8B66A]/10 text-[#8A692C]"
                  }`}
                >
                  {savedDomain.status || "Pending"}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label
                    htmlFor="sending-domain"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
                  >
                    Domain
                  </label>

                  <input
                    id="sending-domain"
                    type="text"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="rosekeyrealty.com"
                    className={inputClasses}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={primaryButtonClasses}
                >
                  {isSaving ? "Adding Domain..." : "Add Domain"}
                </button>
              </form>
            )}

            {!savedDomain && !isLoadingDomains && (
              <div className="mt-5 rounded-md border border-[#EDE7DC] bg-[#FBF7EF] px-4 py-3">
                <p className="text-xs leading-5 text-[#7C7265]">
                  <span className="font-semibold text-[#29231D]">Example:</span>{" "}
                  If your business website is{" "}
                  <span className="font-medium text-[#B7832F]">
                    rosekeyrealty.com
                  </span>
                  , enter{" "}
                  <span className="font-medium text-[#29231D]">
                    rosekeyrealty.com
                  </span>
                  .
                </p>
              </div>
            )}
          </section>

          {/* Existing Domain / DNS */}
          {!isLoadingDomains && savedDomain && (
            <section className="rounded-xl border border-[#EDE7DC] bg-white/50 p-6 backdrop-blur-sm lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                    Sending Domain
                  </p>

                  <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                    {savedDomain.domain}
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-[#7C7265]">
                    Add the DNS records below to authenticate your domain with
                    Postmark.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3"></div>

                <div className="flex flex-wrap items-center gap-3"></div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    savedDomain.status === "verified"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-[#D8B66A]/40 bg-[#D8B66A]/10 text-[#8A692C]"
                  }`}
                >
                  {savedDomain.status || "Pending"}
                </span>

                {savedDomain.status !== "verified" && (
                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={isVerifying}
                    className="inline-flex items-center justify-center rounded-md bg-[#0D0C0A] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#D8B66A]/30 border-t-[#D8B66A]" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Domain"
                    )}
                  </button>
                )}
              </div>

              <div className="mt-6 rounded-lg border border-[#EDE7DC] bg-[#FBF7EF] p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#29231D]">
                    DNS Verification Records
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#7C7265]">
                    Click Copy beside a DNS value instead of manually selecting
                    the text.
                  </p>
                </div>

                {savedDomain.dns_records &&
                savedDomain.dns_records.length > 0 ? (
                  <div className="space-y-4">
                    {savedDomain.dns_records.map((record, index) => {
                      const name = record.name || "";

                      const value = record.value || "";

                      const nameFieldId = `dns-name-${index}`;

                      const valueFieldId = `dns-value-${index}`;

                      const nameCopied = copiedField === nameFieldId;

                      const valueCopied = copiedField === valueFieldId;

                      const recordPurpose =
                        record.purpose || record.record || "Authentication";

                      return (
                        <div
                          key={`${record.type}-${record.name}-${index}`}
                          className="rounded-lg border border-[#E3DCD0] bg-white p-5"
                        >
                          {/* Record Header */}
                          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex rounded-full border border-[#D8B66A]/40 bg-[#D8B66A]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A692C]">
                                {record.type || "DNS"}
                              </span>

                              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A89C8D]">
                                {recordPurpose.replace("_", " ")}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                record.status === "verified"
                                  ? "text-emerald-700"
                                  : "text-[#8F8578]"
                              }`}
                            >
                              {record.status === "verified"
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>

                          {/* Name */}
                          <div className="mb-4">
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                              Name / Host
                            </label>

                            <div className="flex items-stretch gap-2">
                              <div className="min-w-0 flex-1 rounded-md border border-[#EDE7DC] bg-[#FBF7EF] px-4 py-3">
                                <code className="block break-all text-[11px] leading-5 text-[#29231D]">
                                  {name || "—"}
                                </code>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(name, nameFieldId)
                                }
                                disabled={!name}
                                aria-label={
                                  nameCopied ? "Name copied" : "Copy DNS name"
                                }
                                className="inline-flex min-w-[82px] items-center justify-center gap-2 rounded-md border border-[#E3DCD0] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7C7265] transition-all duration-300 hover:border-[#D8B66A]/70 hover:bg-[#B7832F]/5 hover:text-[#B7832F] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {nameCopied ? (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="text-emerald-600"
                                    >
                                      ✓
                                    </span>
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <span aria-hidden="true">⧉</span>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Value */}
                          <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                              Value / Target
                            </label>

                            <div className="flex items-stretch gap-2">
                              <div className="min-w-0 flex-1 rounded-md border border-[#EDE7DC] bg-[#FBF7EF] px-4 py-3">
                                <code className="block break-all text-[11px] leading-5 text-[#29231D]">
                                  {value || "—"}
                                </code>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(value, valueFieldId)
                                }
                                disabled={!value}
                                aria-label={
                                  valueCopied
                                    ? "Value copied"
                                    : "Copy DNS value"
                                }
                                className="inline-flex min-w-[82px] items-center justify-center gap-2 rounded-md border border-[#E3DCD0] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7C7265] transition-all duration-300 hover:border-[#D8B66A]/70 hover:bg-[#B7832F]/5 hover:text-[#B7832F] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {valueCopied ? (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="text-emerald-600"
                                    >
                                      ✓
                                    </span>
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <span aria-hidden="true">⧉</span>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-[#E3DCD0] bg-white px-4 py-6 text-center">
                    <p className="text-xs text-[#7C7265]">
                      DNS records were not returned by the email provider.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Email Sending Overview */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7832F]">
                Provider
              </p>

              <p className="mt-3 font-serif text-xl text-[#29231D]">Postmark</p>

              <p className="mt-2 text-xs leading-5 text-[#7C7265]">
                RoseVault&apos;s email delivery and domain authentication
                provider.
              </p>
            </div>

            <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7832F]">
                Authentication
              </p>

              <p className="mt-3 font-serif text-xl text-[#29231D]">
                DNS Verification
              </p>

              <p className="mt-2 text-xs leading-5 text-[#7C7265]">
                Your domain must be authenticated before production sending.
              </p>
            </div>

            <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7832F]">
                Campaigns
              </p>

              <p className="mt-3 font-serif text-xl text-[#29231D]">
                Ready to Connect
              </p>

              <p className="mt-2 text-xs leading-5 text-[#7C7265]">
                Verified domains can be used by RoseVault email campaigns.
              </p>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex flex-col gap-3 border-t border-[#EDE7DC] pt-6 sm:flex-row">
            <Link href="/email/compose" className={secondaryButtonClasses}>
              Compose Email
            </Link>

            <Link href="/email/templates" className={secondaryButtonClasses}>
              Email Templates
            </Link>

            <Link
              href="/marketing/campaigns"
              className={secondaryButtonClasses}
            >
              Email Campaigns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
