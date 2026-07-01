import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "instructor"
  | "content_manager"
  | "student";

export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  status?: boolean;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

type LoginPayload = {
  login: string;
  password: string;
  portal: "student" | "admin";
  device_id?: string;
  platform?: "web" | "android" | "ios";
  fcm_token?: string | null;
};

type LoginResponse = {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
  };
  message: string;
  errors: unknown;
};

const TOKEN_KEY = "ilab.access_token";
const USER_KEY = "ilab.auth.user";
const DEVICE_KEY = "ilab.device_id";

const listeners = new Set<() => void>();

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

let state: AuthState = {
  user: readUser(),
  token: readToken(),
  loading: false,
};

function emit() {
  for (const listener of listeners) listener();
}

function setState(nextState: Partial<AuthState>) {
  state = {
    ...state,
    ...nextState,
  };

  if (typeof window !== "undefined") {
    if (state.token) {
      window.localStorage.setItem(TOKEN_KEY, state.token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    if (state.user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  }

  emit();
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server-device";

  const existing = window.localStorage.getItem(DEVICE_KEY);

  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(DEVICE_KEY, generated);

  return generated;
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  getUser(): AuthUser | null {
    return state.user;
  },

  getToken(): string | null {
    return state.token;
  },

  isAuthenticated(): boolean {
    return Boolean(state.token && state.user);
  },

  async login(payload: LoginPayload) {
    setState({ loading: true });

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        ...payload,
        device_id: payload.device_id ?? getDeviceId(),
        platform: payload.platform ?? "web",
        fcm_token: payload.fcm_token ?? null,
      });

      setState({
        user: response.data.data.user,
        token: response.data.data.token,
        loading: false,
      });

      return response.data;
    } catch (error) {
      setState({ loading: false });
      throw error;
    }
  },

  async logout() {
    try {
      if (state.token) {
        await api.post("/auth/logout");
      }
    } catch {
      // Clear local session even if API logout fails.
    } finally {
      setState({
        user: null,
        token: null,
        loading: false,
      });
    }
  },

  setSession(user: AuthUser, token: string) {
    setState({
      user,
      token,
      loading: false,
    });
  },

  clearSession() {
    setState({
      user: null,
      token: null,
      loading: false,
    });
  },

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

const subscribe = (listener: () => void) => authStore.subscribe(listener);
const getSnapshot = () => authStore.getState();

const getServerSnapshot = (): AuthState => ({
  user: null,
  token: null,
  loading: false,
});

export function useAuth() {
  const auth = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const role = auth.user?.role ?? null;

  return {
    ...auth,

    isAuthenticated: Boolean(auth.token && auth.user),

    isStudent: role === "student",
    isInstructor: role === "instructor",
    isManager: role === "manager",
    isAdmin:
      role === "admin" ||
      role === "super_admin" ||
      role === "manager" ||
      role === "instructor" ||
      role === "content_manager",
    isSuperAdmin: role === "super_admin",

    login: authStore.login,
    logout: authStore.logout,
    setSession: authStore.setSession,
    clearSession: authStore.clearSession,
  };
}
