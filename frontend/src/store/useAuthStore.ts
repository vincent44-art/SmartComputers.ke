import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setStoredToken } from "@/lib/api";
import {
  login as loginRequest,
  register as registerRequest,
} from "@/lib/services";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
login: async (email, password) => {
    const res = await loginRequest(email, password);
    setStoredToken(res.accessToken);
    set({ user: res.user });
    return { role: res.user.role };
  },
      register: async (payload) => {
        const res = await registerRequest(payload);
        setStoredToken(res.accessToken);
        set({ user: res.user });
      },
      logout: () => {
        setStoredToken(null);
        set({ user: null });
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "sc-auth",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
