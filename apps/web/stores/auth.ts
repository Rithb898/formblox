import { create } from "zustand";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean | null;
  profileImageUrl: string | null;
  createdAt: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  _setUser: (user: AuthUser | null) => void;
  _setLoading: (loading: boolean) => void;
  _setLogout: (fn: () => Promise<void>) => void;
  _setLogoutAll: (fn: () => Promise<void>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  logout: async () => { window.location.href = "/login"; },
  logoutAll: async () => { window.location.href = "/login"; },
  _setUser: (user) => set({ user }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setLogout: (logout) => set({ logout }),
  _setLogoutAll: (logoutAll) => set({ logoutAll }),
}));
