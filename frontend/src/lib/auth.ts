// Lightweight client-side auth store (mock — swap with real API later).
// Persists to localStorage, exposes a subscribe API for React's
// useSyncExternalStore, and is SSR-safe.

import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

const STORAGE_KEY = "ilab.auth.user";

const listeners = new Set<() => void>();

function readFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

let currentUser: AuthUser | null = readFromStorage();

function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  getUser(): AuthUser | null {
    return currentUser;
  },
  isAuthenticated(): boolean {
    return currentUser !== null;
  },
  login(user: AuthUser) {
    currentUser = user;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    emit();
  },
  logout() {
    currentUser = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const subscribe = (l: () => void) => authStore.subscribe(l);
const getSnapshot = () => currentUser;
const getServerSnapshot = () => null;

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    user,
    isAuthenticated: user !== null,
    login: authStore.login,
    logout: authStore.logout,
  };
}
