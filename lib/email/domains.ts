import { resend } from "./resend";

export type ResendDnsRecord = {
  record?: string;
  name?: string;
  type?: string;
  value?: string;
  ttl?: string;
  status?: string;
  priority?: number;
};

type DnsRecordWithPriority = {
  record?: string;
  name?: string;
  type?: string;
  value?: string;
  ttl?: string;
  status?: string;
  priority?: number;
};

export type CreateResendDomainResult = {
  success: boolean;
  domainId: string | null;
  domain: string | null;
  dnsRecords: ResendDnsRecord[];
  error: unknown | null;
};

export async function createResendDomain(
  domain: string
): Promise<CreateResendDomainResult> {
  const normalizedDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!normalizedDomain) {
    return {
      success: false,
      domainId: null,
      domain: null,
      dnsRecords: [],
      error: "A domain is required.",
    };
  }

  if (
    normalizedDomain.includes("/") ||
    normalizedDomain.includes("@") ||
    normalizedDomain.includes(" ")
  ) {
    return {
      success: false,
      domainId: null,
      domain: normalizedDomain,
      dnsRecords: [],
      error: "Please enter a valid domain name.",
    };
  }

  try {
    const { data, error } = await resend.domains.create({
      name: normalizedDomain,
    });

    if (error) {
      return {
        success: false,
        domainId: null,
        domain: normalizedDomain,
        dnsRecords: [],
        error,
      };
    }

    const dnsRecords = Array.isArray(data?.records)
      ? data.records.map((record: DnsRecordWithPriority) => ({
          record: record.record,
          name: record.name,
          type: record.type,
          value: record.value,
          ttl: record.ttl,
          status: record.status,
          // "priority" may not exist on all record types returned by the API,
          // use the typed property when present.
          priority: record.priority,
        }))
      : [];

    return {
      success: true,
      domainId: data?.id ?? null,
      domain: normalizedDomain,
      dnsRecords,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      domainId: null,
      domain: normalizedDomain,
      dnsRecords: [],
      error,
    };
  }
}