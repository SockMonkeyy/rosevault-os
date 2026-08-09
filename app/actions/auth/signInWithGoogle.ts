"use server";

import { redirect } from "next/navigation";
import { googleService } from "../../services/auth/googleService";

export async function signInWithGoogle() {
  const url = await googleService.signIn();

  redirect(url);
}