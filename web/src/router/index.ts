import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import HomeView from "../components/HomeView.vue";
import LoginView from "../components/LoginView.vue";
import RegisterView from "../components/RegisterView.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: HomeView },

  // If logged in, redirect away from these
  { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
  { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },

  // Example protected route for later (you can keep it commented until you create the page)
  // { path: "/recipes/new", name: "recipe-new", component: RecipeNewView, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


router.beforeEach(async (to) => {
  // Only hit /api/me when we actually need auth state to decide routing
  const needsAuthDecision = !!to.meta.requiresAuth || !!to.meta.guestOnly;

  let isAuthed = false;
  if (needsAuthDecision) {
    try {
      const res = await fetch("/api/me");
      isAuthed = res.ok;
    } catch {
      isAuthed = false;
    }
  }

  // Protected route: must be logged in
  if (to.meta.requiresAuth && !isAuthed) {
    return { name: "login" };
  }

  // Guest-only route: must be logged out
  if (to.meta.guestOnly && isAuthed) {
    return { name: "home" };
  }

  return true;
});

export default router;