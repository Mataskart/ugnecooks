import { ref, computed } from "vue";
import { api } from "./api";

/**
 * Shape returned by /api/me and auth endpoints.
 * Note: role is included (USER / ADMIN) so the frontend can show admin UI.
 */
export type PublicUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error?: string; user?: null };

/**
 * Single reactive user state for the whole app.
 * Because these refs live at module scope, every component calling useAuth()
 * shares the same state (like a tiny store).
 */
const user = ref<PublicUser | null>(null);
const loading = ref(false);

/**
 * Admin status can come from two places:
 *  1) user.role === "ADMIN" (from /api/me)
 *  2) /api/admin/status => { ok: true, isAdmin: boolean }
 *
 * #2 is optional but useful:
 * - It gives you a dedicated "admin check" endpoint
 * - It stays future-proof if you ever decide to not return role in /api/me
 */
const adminStatus = ref<boolean>(false);

export function useAuth() {
  /**
   * True if we have a logged-in user.
   */
  const isAuthed = computed(() => !!user.value);

  /**
   * True if current session is admin.
   * We trust user.role primarily, but also keep adminStatus as a fallback.
   */
  const isAdmin = computed(() => user.value?.role === "ADMIN" || adminStatus.value === true);

  /**
   * Refresh only admin status from backend.
   * - If not logged in => admin=false.
   * - If request fails => admin=false (safe default).
   */
  async function refreshAdminStatus(): Promise<void> {
    if (!user.value) {
      adminStatus.value = false;
      return;
    }

    try {
      const data = await api<ApiOk<{ isAdmin: boolean }> | ApiErr>("/api/admin/status");
      adminStatus.value = !!(data as any).isAdmin;
    } catch {
      adminStatus.value = false;
    }
  }

  /**
   * Refresh session state from backend.
   * Called once on app load, and can be called again after login/logout if needed.
   *
   * Also refreshes admin status if logged in.
   */
  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }> | ApiErr>("/api/me");
      user.value = (data as any).user ?? null;

      // Keep admin status in sync with the session.
      await refreshAdminStatus();
    } catch {
      user.value = null;
      adminStatus.value = false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Register a new user (creates session cookie).
   * Note: role defaults to USER; admins are promoted manually via DB.
   */
  async function register(email: string, password: string): Promise<PublicUser> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }>>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      user.value = data.user;

      // If the backend ever auto-promotes certain emails in the future,
      // this keeps UI consistent immediately.
      await refreshAdminStatus();

      return data.user;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Login (creates session cookie).
   */
  async function login(email: string, password: string): Promise<PublicUser> {
    loading.value = true;
    try {
      const data = await api<ApiOk<{ user: PublicUser }>>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      user.value = data.user;

      // Sync admin status for nav/guards immediately.
      await refreshAdminStatus();

      return data.user;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout (clears cookie session).
   */
  async function logout(): Promise<void> {
    loading.value = true;
    try {
      await api<ApiOk<{}>>("/api/auth/logout", { method: "POST" });
    } finally {
      user.value = null;
      adminStatus.value = false;
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    isAuthed,
    isAdmin,
    refresh,
    refreshAdminStatus,
    register,
    login,
    logout,
  };
}
