import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";

import RecipesListView from "../views/RecipesListView.vue";
import RecipeDetailView from "../views/RecipeDetailView.vue";

import AdminRecipesView from "../views/admin/AdminRecipesView.vue";
import AdminRecipeNewView from "../views/admin/AdminRecipeNewView.vue";
import AdminRecipeEditView from "../views/admin/AdminRecipeEditView.vue";

/**
 * Route meta flags:
 * - guestOnly: logged-in users are redirected away
 * - requiresAuth: must be logged in
 * - requiresAdmin: must be logged in AND have role ADMIN
 */
const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: HomeView },

  // Public recipes
  { path: "/recipes", name: "recipes", component: RecipesListView },
  { path: "/recipes/:slug", name: "recipe", component: RecipeDetailView },

  // Auth (guest-only)
  { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
  { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },

  // Admin-only recipe management
  { path: "/admin/recipes", name: "admin-recipes", component: AdminRecipesView, meta: { requiresAdmin: true } },
  { path: "/admin/recipes/new", name: "admin-recipe-new", component: AdminRecipeNewView, meta: { requiresAdmin: true } },
  { path: "/admin/recipes/:id/edit", name: "admin-recipe-edit", component: AdminRecipeEditView, meta: { requiresAdmin: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Response shape for /api/me (when logged in):
 * { ok: true, user: { role: "USER"|"ADMIN", ... } }
 */
type MeResponse = {
  ok: boolean;
  user?: { role?: "USER" | "ADMIN" };
};

/**
 * Central guard:
 * - Only calls /api/me if the route needs auth/admin decision.
 * - Uses /api/me because it returns role (USER/ADMIN).
 *
 * NOTE: This is intentionally simple.
 * If later you want "no network call per navigation", we can
 * hook this into auth.ts state and do a single refresh() on app load.
 */
router.beforeEach(async (to) => {
  const needsAuthDecision =
    !!to.meta.requiresAuth || !!to.meta.guestOnly || !!to.meta.requiresAdmin;

  let me: MeResponse | null = null;

  if (needsAuthDecision) {
    try {
      const res = await fetch("/api/me");

      // Don't assume JSON on failures; parse safely.
      const text = await res.text();
      const data = text ? (JSON.parse(text) as MeResponse) : null;

      // If not OK, treat as not logged in.
      me = res.ok ? data : null;
    } catch {
      me = null;
    }
  }

  const isAuthed = !!me?.user;
  const isAdmin = me?.user?.role === "ADMIN";

  // Admin routes: must be admin
  if (to.meta.requiresAdmin) {
    if (!isAuthed) return { name: "login" };
    if (!isAdmin) return { name: "home" };
  }

  // Auth-only routes (reserved for future non-admin protected pages)
  if (to.meta.requiresAuth && !isAuthed) {
    return { name: "login" };
  }

  // Guest-only routes: redirect logged-in users to home
  if (to.meta.guestOnly && isAuthed) {
    return { name: "home" };
  }

  return true;
});

export default router;