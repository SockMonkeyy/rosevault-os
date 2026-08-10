import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { onboardingService } from "@/app/services/auth/onboardingService";
// Dynamically import onboardingService at runtime to avoid module resolution
// issues with the build-time path alias.

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  const supabase = await createClient();

  // Exchange the OAuth authorization code for a Supabase session.
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback exchange error:", error.message);

        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            "Could not authenticate user"
          )}`
        );
      }
    } catch (err) {
      console.error("Unexpected auth callback error:", err);

      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  // Get the authenticated user after the session exchange.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Unable to retrieve authenticated user:", userError);

    return NextResponse.redirect(`${origin}/login`);
  }

  // Determine where the user should go after authentication.
  try {
    const destination = await onboardingService.determineDestination(user.id);

    return NextResponse.redirect(`${origin}${destination}`);
  } catch (err) {
    console.error(
      "Failed to determine onboarding destination:",
      err
    );

    // Safe fallback if onboarding lookup fails.
    return NextResponse.redirect(`${origin}/`);
  }
}