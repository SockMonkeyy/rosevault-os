import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createPostmarkDomain } from "@/app/providers/email/PostmarkDomainService";

export async function GET() {
  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Verify the logged-in user
    // ---------------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to view email domains.",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------------------
    // 2. Find the user's organization
    // ---------------------------------------------------------

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Organization membership lookup error:",
        membershipError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to determine your organization.",
        },
        {
          status: 500,
        },
      );
    }

    if (!membership?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not associated with a RoseVault organization.",
        },
        {
          status: 403,
        },
      );
    }

    // ---------------------------------------------------------
    // 3. Load this organization's email domains
    // ---------------------------------------------------------

    const {
      data: domains,
      error: domainsError,
    } = await supabase
      .from("email_sending_domains")
      .select(
        `
          id,
          organization_id,
          domain,
          provider,
          provider_domain_id,
          status,
          spf_status,
          dkim_status,
          dmarc_status,
          dns_records,
          verified_at,
          created_at,
          updated_at
        `,
      )
      .eq(
        "organization_id",
        membership.organization_id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (domainsError) {
      console.error(
        "Email sending domains lookup error:",
        domainsError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load your email domains.",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------------------
    // 4. Return the organization's domains
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      domains: domains ?? [],
    });
  } catch (error) {
    console.error(
      "Get email domains error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load your email domains.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Verify the logged-in user
    // ---------------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must be signed in to add an email domain.",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------------------
    // 2. Find the user's organization
    // ---------------------------------------------------------

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Organization membership lookup error:",
        membershipError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to determine your organization.",
        },
        {
          status: 500,
        },
      );
    }

    if (!membership?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not associated with a RoseVault organization.",
        },
        {
          status: 403,
        },
      );
    }

    const organizationId =
      membership.organization_id;

    // ---------------------------------------------------------
    // 3. Read and validate the requested domain
    // ---------------------------------------------------------

    const body = await request.json();

    const domain =
      typeof body?.domain === "string"
        ? body.domain.trim()
        : "";

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          error: "A domain is required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    if (
      normalizedDomain.includes("/") ||
      normalizedDomain.includes("@") ||
      normalizedDomain.includes(" ")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid domain name.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 4. Check for an existing RoseVault domain
    // ---------------------------------------------------------

    const {
      data: existingDomain,
      error: existingDomainError,
    } = await supabase
      .from("email_sending_domains")
      .select(
        "id, domain, status, provider",
      )
      .eq("organization_id", organizationId)
      .eq("domain", normalizedDomain)
      .maybeSingle();

    if (existingDomainError) {
      console.error(
        "Existing email domain lookup error:",
        existingDomainError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to check the existing email domain.",
        },
        {
          status: 500,
        },
      );
    }

    if (existingDomain) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This domain has already been added to your organization.",
          domainId: existingDomain.id,
          status: existingDomain.status,
          provider: existingDomain.provider,
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------------------
    // 5. Create the domain in Postmark
    // ---------------------------------------------------------

    const postmarkResult =
      await createPostmarkDomain(
        normalizedDomain,
      );

    if (!postmarkResult.success) {
      console.error(
        "Postmark domain creation error:",
        postmarkResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            postmarkResult.error instanceof Error
              ? postmarkResult.error.message
              : typeof postmarkResult.error ===
                  "string"
                ? postmarkResult.error
                : "Postmark rejected the domain creation request.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 6. Save the domain in RoseVault
    // ---------------------------------------------------------

    const {
      data: savedDomain,
      error: saveError,
    } = await supabase
      .from("email_sending_domains")
      .insert({
        organization_id: organizationId,
        domain: normalizedDomain,

        provider: "postmark",

        provider_domain_id:
          postmarkResult.domainId,

        status: "pending",

        spf_status:
          postmarkResult.spfStatus,

        dkim_status:
          postmarkResult.dkimStatus,

        dmarc_status: "pending",

        dns_records:
          postmarkResult.dnsRecords,
      })
      .select(
        `
          id,
          organization_id,
          domain,
          provider,
          provider_domain_id,
          status,
          spf_status,
          dkim_status,
          dmarc_status,
          dns_records,
          verified_at,
          created_at,
          updated_at
        `,
      )
      .single();

    if (saveError) {
      console.error(
        "Save email sending domain error:",
        saveError,
      );

      /*
       * Important:
       *
       * The domain has already been created in Postmark.
       * We do NOT automatically delete it here because we
       * want to preserve the provider-side record while we
       * diagnose a database failure.
       */
      return NextResponse.json(
        {
          success: false,
          error:
            "The domain was created with Postmark, but could not be saved in RoseVault.",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------------------
    // 7. Return the RoseVault domain record
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      domain: savedDomain,
    });
  } catch (error) {
    console.error(
      "Create email domain error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create the email domain.",
      },
      {
        status: 500,
      },
    );
  }
}