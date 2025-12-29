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
          <img
            class="brand__logo"
            src="/favicon.png"
            alt="UgneCooks logo"
          />
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
            <!-- <router-link class="btn" to="/register">Registruotis</router-link>       DISABLED REGISTER BUTTON-->
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
/* App wrapper just ensures full-height; all layout styling is global in src/style.css */
.app {
  min-height: 100vh;
}
.brand__logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  border-radius: 6px;
}
@media (min-width: 900px) {
  .brand__logo {
    width: 40px;
    height: 40px;
  }
}
</style>