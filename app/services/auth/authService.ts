import { authRepository } from "../../repositories/auth/authRepository";
export class AuthService {
  async getCurrentUser() {
    return authRepository.getCurrentUser();
  }

  async getCurrentSession() {
    return authRepository.getCurrentSession();
  }

  async signOut() {
    return authRepository.signOut();
  }

  async getMembership(userId: string) {
    return authRepository.getMembership(userId);
  }

  async requireUser() {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error("Authentication required.");
    }

    return user;
  }

  async requireMembership() {
    const user = await this.requireUser();

    const membership = await this.getMembership(user.id);

    if (!membership) {
      throw new Error("Organization membership not found.");
    }

    return {
      user,
      membership,
    };
  }
}

export const authService = new AuthService();