import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { verifyPostmarkDomain } from "@/app/providers/email/PostmarkDomainService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
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
            "You must be signed in to verify an email domain.",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------------------
    // 2. Get the RoseVault domain record ID
    // ---------------------------------------------------------

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "A domain ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 3. Find the user's organization
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
    // 4. Load the domain belonging to this organization
    // ---------------------------------------------------------

    const {
      data: domainRecord,
      error: domainError,
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
      .eq("id", id)
      .eq(
        "organization_id",
        organizationId,
      )
      .maybeSingle();

    if (domainError) {
      console.error(
        "Email domain lookup error:",
        domainError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load the email domain.",
        },
        {
          status: 500,
        },
      );
    }

    if (!domainRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The requested email domain was not found.",
        },
        {
          status: 404,
        },
      );
    }

    // ---------------------------------------------------------
    // 5. Make sure this is a Postmark domain
    // ---------------------------------------------------------

    if (
      domainRecord.provider !==
      "postmark"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This domain is not configured with Postmark.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 6. Make sure we have the Postmark domain ID
    // ---------------------------------------------------------

    if (
      !domainRecord.provider_domain_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This domain is missing its Postmark domain ID.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 7. Ask Postmark to verify the domain
    // ---------------------------------------------------------

    const verification =
      await verifyPostmarkDomain(
        String(
          domainRecord.provider_domain_id,
        ),
      );

    if (!verification.success) {
      console.error(
        "Postmark domain verification failed:",
        verification.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            verification.error instanceof Error
              ? verification.error.message
              : typeof verification.error ===
                  "string"
                ? verification.error
                : "Postmark could not verify the domain.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 8. Determine the RoseVault status
    // ---------------------------------------------------------

    const verified =
      verification.status ===
      "verified";

    const newStatus = verified
      ? "verified"
      : "pending";

    // ---------------------------------------------------------
    // 9. Update the RoseVault domain record
    // ---------------------------------------------------------

    const updatePayload = {
      status: newStatus,

      spf_status:
        verification.spfVerified
          ? "verified"
          : "pending",

      dkim_status:
        verification.dkimVerified
          ? "verified"
          : "pending",

      /*
       * DMARC is not being claimed as verified by
       * Postmark's domain verification call.
       *
       * We keep it pending until RoseVault has a
       * dedicated DMARC verification implementation.
       */
      dmarc_status:
        domainRecord.dmarc_status ||
        "pending",

      dns_records:
        verification.dnsRecords,

      verified_at: verified
        ? new Date().toISOString()
        : null,
    };

    const {
      data: updatedDomain,
      error: updateError,
    } = await supabase
      .from("email_sending_domains")
      .update(updatePayload)
      .eq("id", domainRecord.id)
      .eq(
        "organization_id",
        organizationId,
      )
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

    if (updateError) {
      console.error(
        "Email domain verification database update error:",
        updateError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Postmark returned the verification status, but RoseVault could not save it.",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------------------
    // 10. Return the updated domain
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      verified,
      domain: updatedDomain,
    });
  } catch (error) {
    console.error(
      "Verify email domain error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to verify the email domain.",
      },
      {
        status: 500,
      },
    );
  }
}