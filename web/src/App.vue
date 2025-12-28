<script setup lang="ts">
import { onMounted } from "vue";
import { useAuth } from "./auth";

const { user, isAuthed, isAdmin, loading, refresh, logout } = useAuth();

/**
 * On initial app load, re-hydrate session state from /api/me.
 * This ensures refresh + direct links work correctly.
 */
onMounted(() => {
  refresh();
});
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="topbar__inner">
        <router-link class="brand" to="/">
          <span class="brand__dot" aria-hidden="true"></span>
          UgneCooks
        </router-link>

        <nav class="nav">
          <!-- Public recipes list -->
          <router-link class="nav__link" to="/recipes">Receptai</router-link>

          <!-- Admin nav is shown only if user is admin -->
          <router-link
            v-if="isAdmin"
            class="nav__link nav__link--pill"
            to="/admin/recipes"
          >
            Adminam
          </router-link>
        </nav>

        <div class="auth">
          <template v-if="isAuthed">
            <span class="auth__email">{{ user?.email }}</span>

            <!-- Disable logout while any auth request is in progress -->
            <button class="btn btn--ghost" @click="logout" :disabled="loading">
              {{ loading ? "…" : "Atsijungti" }}
            </button>
          </template>

          <template v-else>
            <router-link class="btn btn--ghost" to="/login">Prisijungti</router-link>
            <router-link class="btn" to="/register">Registruotis</router-link>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>


    <footer class="footer">
      <div class="footer__inner">
        <small>© {{ new Date().getFullYear() }} UgneCooks</small>
      </div>
    </footer>
  </div>
</template>

<style scoped>

/* -------------------------------------------------------------------------- */
/* Global layout safety (prevents horizontal overflow across ALL pages)        */
/* -------------------------------------------------------------------------- */

:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: border-box;
}

:global(html),
:global(body) {
  width: 100%;
  overflow-x: hidden;
}

:global(img) {
  max-width: 100%;
  height: auto;
  display: block;
}


/* Simple design system (no framework) */
.app {
  --bg: #0b0c10;
  --panel: #12141b;
  --panel-2: #171a23;
  --text: #e9ecf1;
  --muted: #aab2c0;
  --border: rgba(255, 255, 255, 0.08);
  --accent: #7c5cff;

  min-height: 100vh;
  background: radial-gradient(1200px 600px at 20% 0%, rgba(124, 92, 255, 0.25), transparent 60%),
    radial-gradient(900px 500px at 100% 20%, rgba(0, 209, 255, 0.12), transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji",
    "Segoe UI Emoji";
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
  background: rgba(11, 12, 16, 0.65);
  border-bottom: 1px solid var(--border);
}

.topbar__inner,
.footer__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 20px;
}

.topbar__inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-decoration: none;
  color: var(--text);
}

.brand__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.2);
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 8px;
}

.nav__link {
  color: var(--muted);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 10px;
}

.nav__link:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.06);
}

.nav__link--pill {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.auth {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth__email {
  color: var(--muted);
  font-size: 14px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.15);
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
}

.btn:hover {
  background: rgba(124, 92, 255, 0.22);
}

.btn--ghost {
  border-color: var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.btn--ghost:hover {
  background: rgba(255, 255, 255, 0.06);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* main should NOT be a container */
.main {
  padding-top: 26px;
  padding-bottom: 56px;
}

/* shared page container */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer {
  border-top: 1px solid var(--border);
  background: rgba(11, 12, 16, 0.5);
  color: var(--muted);
}
</style>
