import { ref, computed } from "vue";

export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error?: string; user?: null };

type ApiError = {
  status: number;
  data: any;
  message: string;
};

const user = ref<PublicUser | null>(null);
const loading = ref(false);

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  const res = await fetch(path, { ...opts, headers });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      data,
      message: (data && data.error) ? String(data.error) : `Request failed: ${res.status}`,
    };
    throw err;
  }

  return data as T;
}

export function useAuth() {
  const isAuthed = computed(() => !!user.value);

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }> | ApiErr>("/api/me");
      user.value = (data as any).user ?? null;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string): Promise<PublicUser> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }>>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      user.value = data.user;
      return data.user;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<PublicUser> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }>>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      user.value = data.user;
      return data.user;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    loading.value = true;
    try {
      await api<ApiOk<{}>>("/api/auth/logout", { method: "POST" });
    } finally {
      user.value = null;
      loading.value = false;
    }
  }

  return { user, loading, isAuthed, refresh, register, login, logout };
}
