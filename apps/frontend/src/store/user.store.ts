'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  clear: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      clear: () => set({ user: null, token: null }),
    }),
    {
      name: "subahbd-user",
    },
  ),
);
