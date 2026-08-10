import { authRepository } from "../../repositories/auth/authRepository";

export class OnboardingService {
  async determineDestination(userId: string) {
    const membership = await authRepository.getMembership(userId);

    // Existing member
    if (membership) {
      return "/dashboard";
    }

    const user = await authRepository.getCurrentUser();

    if (!user?.email) {
      return "/login";
    }

    const invitation = await authRepository.getPendingInvitation(user.email);

    if (invitation) {
      return "/accept-invitation";
    }

    return "/onboarding";

    // Future:
    // Check pending invitations here.

    return "/onboarding";
  }
}

export const onboardingService = new OnboardingService();
