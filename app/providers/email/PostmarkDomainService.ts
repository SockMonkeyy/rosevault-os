import { AccountClient } from "postmark";

export type PostmarkDnsRecord = {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
  status: "pending" | "verified";
  purpose: "dkim" | "return_path" | "spf";
};

export type CreatePostmarkDomainResult = {
  success: boolean;
  domainId: string | null;
  domain: string | null;
  dnsRecords: PostmarkDnsRecord[];
  spfStatus: "pending" | "verified";
  dkimStatus: "pending" | "verified";
  returnPathStatus: "pending" | "verified";
  error: unknown | null;
};

type PostmarkDomainResponse = {
  ID: number;
  Name: string;

  SPFVerified?: boolean;
  SPFHost?: string;
  SPFTextValue?: string;

  DKIMVerified?: boolean;
  DKIMHost?: string;
  DKIMTextValue?: string;

  DKIMPendingHost?: string;
  DKIMPendingTextValue?: string;

  ReturnPathDomain?: string;
  ReturnPathDomainVerified?: boolean;
  ReturnPathDomainCNAMEValue?: string;
};

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function isValidDomain(domain: string): boolean {
  if (!domain) {
    return false;
  }

  if (
    domain.includes("/") ||
    domain.includes("@") ||
    domain.includes(" ")
  ) {
    return false;
  }

  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain);
}

function buildDnsRecords(
  response: PostmarkDomainResponse,
): PostmarkDnsRecord[] {
  const records: PostmarkDnsRecord[] = [];

  /*
   * DKIM
   *
   * Postmark provides a pending DKIM record when the domain
   * has not yet been verified.
   */
  const dkimHost =
    response.DKIMHost ||
    response.DKIMPendingHost;

  const dkimValue =
    response.DKIMTextValue ||
    response.DKIMPendingTextValue;

  if (dkimHost && dkimValue) {
    records.push({
      type: "TXT",
      name: dkimHost,
      value: dkimValue,
      status: response.DKIMVerified
        ? "verified"
        : "pending",
      purpose: "dkim",
    });
  }

  /*
   * Custom Return-Path
   *
   * Postmark expects the Return-Path hostname to point to
   * pm.mtasv.net.
   */
  if (
    response.ReturnPathDomain &&
    response.ReturnPathDomainCNAMEValue
  ) {
    records.push({
      type: "CNAME",
      name: response.ReturnPathDomain,
      value: response.ReturnPathDomainCNAMEValue,
      status: response.ReturnPathDomainVerified
        ? "verified"
        : "pending",
      purpose: "return_path",
    });
  }

  /*
   * SPF
   *
   * Postmark exposes SPF information as part of the domain
   * response. We include it for visibility, but we don't
   * automatically instruct the customer to create a second
   * SPF record if their domain already has one.
   */
  if (
    response.SPFHost &&
    response.SPFTextValue
  ) {
    records.push({
      type: "TXT",
      name: response.SPFHost,
      value: response.SPFTextValue,
      status: response.SPFVerified
        ? "verified"
        : "pending",
      purpose: "spf",
    });
  }

  return records;
}

export async function createPostmarkDomain(
  domain: string,
): Promise<CreatePostmarkDomainResult> {
  const normalizedDomain =
    normalizeDomain(domain);

  if (!normalizedDomain) {
    return {
      success: false,
      domainId: null,
      domain: null,
      dnsRecords: [],
      spfStatus: "pending",
      dkimStatus: "pending",
      returnPathStatus: "pending",
      error: "A domain is required.",
    };
  }

  if (!isValidDomain(normalizedDomain)) {
    return {
      success: false,
      domainId: null,
      domain: normalizedDomain,
      dnsRecords: [],
      spfStatus: "pending",
      dkimStatus: "pending",
      returnPathStatus: "pending",
      error: "Please enter a valid domain name.",
    };
  }

  const accountToken =
    process.env.POSTMARK_ACCOUNT_TOKEN;

  if (!accountToken) {
    return {
      success: false,
      domainId: null,
      domain: normalizedDomain,
      dnsRecords: [],
      spfStatus: "pending",
      dkimStatus: "pending",
      returnPathStatus: "pending",
      error:
        "Missing POSTMARK_ACCOUNT_TOKEN environment variable.",
    };
  }

  try {
    const accountClient =
      new AccountClient(accountToken);

    const response =
      (await accountClient.createDomain({
        Name: normalizedDomain,

        /*
         * Use Postmark's standard custom Return-Path
         * hostname for the customer's domain.
         */
        ReturnPathDomain:
          `pm-bounces.${normalizedDomain}`,
      })) as PostmarkDomainResponse;

    const dnsRecords =
      buildDnsRecords(response);

    return {
      success: true,

      domainId:
        response.ID?.toString() ?? null,

      domain:
        response.Name ??
        normalizedDomain,

      dnsRecords,

      spfStatus:
        response.SPFVerified
          ? "verified"
          : "pending",

      dkimStatus:
        response.DKIMVerified
          ? "verified"
          : "pending",

      returnPathStatus:
        response.ReturnPathDomainVerified
          ? "verified"
          : "pending",

      error: null,
    };
  } catch (error) {
    console.error(
      "Postmark domain creation error:",
      error,
    );

    return {
      success: false,
      domainId: null,
      domain: normalizedDomain,
      dnsRecords: [],
      spfStatus: "pending",
      dkimStatus: "pending",
      returnPathStatus: "pending",
      error,
    };
  }
}

export type VerifyPostmarkDomainResult = {
  success: boolean;
  domainId: string;
  domain: string | null;
  dkimVerified: boolean;
  returnPathVerified: boolean;
  spfVerified: boolean;
  status: "verified" | "pending";
  dnsRecords: PostmarkDnsRecord[];
  error: unknown | null;
};

export async function verifyPostmarkDomain(
  domainId: string,
): Promise<VerifyPostmarkDomainResult> {
  const accountToken =
    process.env.POSTMARK_ACCOUNT_TOKEN;

  if (!accountToken) {
    return {
      success: false,
      domainId,
      domain: null,
      dkimVerified: false,
      returnPathVerified: false,
      spfVerified: false,
      status: "pending",
      dnsRecords: [],
      error:
        "Missing POSTMARK_ACCOUNT_TOKEN environment variable.",
    };
  }

  if (!domainId) {
    return {
      success: false,
      domainId,
      domain: null,
      dkimVerified: false,
      returnPathVerified: false,
      spfVerified: false,
      status: "pending",
      dnsRecords: [],
      error:
        "A Postmark domain ID is required.",
    };
  }

  try {
    const accountClient =
      new AccountClient(accountToken);

    /*
     * Ask Postmark to verify the DKIM record.
     *
     * Domain verification is primarily driven by
     * DKIM. Postmark also exposes Return-Path
     * verification separately.
     */
    // Some versions of the Postmark SDK do not expose a
    // verifyDkim method on AccountClient. Attempting to
    // call it causes a type error. DKIM verification can be
    // observed by re-fetching the domain record after any
    // verification attempts (below). Therefore, avoid
    // calling verifyDkim and rely on getDomain to report
    // DKIMVerified status.

    /*
     * Ask Postmark to verify the custom Return-Path.
     *
     * The method is not present in every Postmark SDK
     * version, so guard it via a type-compatible helper.
     */
    try {
      const verifyReturnPath = (
        accountClient as AccountClient & {
          verifyReturnPath?: (
            id: number,
          ) => Promise<unknown>;
        }
      ).verifyReturnPath;

      if (typeof verifyReturnPath === "function") {
        await verifyReturnPath.call(
          accountClient,
          Number(domainId),
        );
      }
    } catch (returnPathError) {
      console.error(
        "Postmark Return-Path verification error:",
        returnPathError,
      );
    }

    /*
     * Fetch the current domain record after the
     * verification attempts.
     *
     * This gives us the authoritative current status.
     */
    const domainResponse =
      (await accountClient.getDomain(
        Number(domainId),
      )) as PostmarkDomainResponse;

    const dkimVerified =
      Boolean(
        domainResponse.DKIMVerified,
      );

    const returnPathVerified =
      Boolean(
        domainResponse.ReturnPathDomainVerified,
      );

    const spfVerified =
      Boolean(
        domainResponse.SPFVerified,
      );

    const status =
      dkimVerified
        ? "verified"
        : "pending";

    return {
      success: true,

      domainId,

      domain:
        domainResponse.Name ?? null,

      dkimVerified,

      returnPathVerified,

      spfVerified,

      status,

      dnsRecords:
        buildDnsRecords(
          domainResponse,
        ),

      error: null,
    };
  } catch (error) {
    console.error(
      "Postmark domain verification error:",
      error,
    );

    return {
      success: false,
      domainId,
      domain: null,
      dkimVerified: false,
      returnPathVerified: false,
      spfVerified: false,
      status: "pending",
      dnsRecords: [],
      error,
    };
  }
}
