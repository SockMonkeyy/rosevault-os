import { createClient } from "@/lib/supabase/server";

export class GoogleService {
  async signIn() {
    const supabase = await createClient();

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

    if (error) {
      throw new Error(error.message);
    }

    return data.url;
  }
}

export const googleService = new GoogleService();