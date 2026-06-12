import { create } from "zustand";
import { persist } from "zustand/middleware";

const VALID_USER = "admin123";
const VALID_PASS = "admin123";

interface AuthState {
  isAuthenticated: boolean;
  username: string;

  login: (user: string, pass: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: "",

      login: (user, pass) => {
        if (user === VALID_USER && pass === VALID_PASS) {
          set({
            isAuthenticated: true,
            username: user,
          });

          return true;
        }

        return false;
      },

      logout: () =>
        set({
          isAuthenticated: false,
          username: "",
        }),
    }),
    {
      name: "auth-store",
    }
  )
);