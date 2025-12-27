<script setup lang="ts">
import { onMounted } from "vue";
import { useAuth } from "./auth";

const { user, isAuthed, refresh, logout } = useAuth();

onMounted(() => {
  refresh();
});
</script>

<template>
  <nav style="display:flex;gap:12px;padding:12px;border-bottom:1px solid #ddd;align-items:center;">
    <router-link to="/">Home</router-link>

    <div style="margin-left:auto;display:flex;gap:12px;align-items:center;">
      <template v-if="isAuthed">
        <span>{{ user?.email }}</span>
        <button @click="logout">Logout</button>
      </template>
      <template v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </template>
    </div>
  </nav>

  <router-view />
</template>

<style scoped>
nav a {
  text-decoration: none;
}
button {
  padding: 6px 10px;
}
</style>
