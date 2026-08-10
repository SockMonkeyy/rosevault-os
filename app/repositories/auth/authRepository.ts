import { createClient } from "@/lib/supabase/server";

export class AuthRepository {
  async getCurrentUser() {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }

  async getCurrentSession() {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return session;
  }

  async getPendingInvitation(email: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  async getMembership(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const authRepository = new AuthRepository();
