<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../auth";

type ApiLikeError = {
  message?: string;
  data?: { error?: string };
};

const router = useRouter();
const { login, loading } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");

function getErrorMessage(e: unknown): string {
  const anyErr = e as ApiLikeError | null;

  if (anyErr?.data?.error) return String(anyErr.data.error);
  if (anyErr?.message) return String(anyErr.message);

  return "Prisijungti nepavyko";
}

async function submit() {
  if (loading.value) return; // safety guard
  error.value = "";

  try {
    await login(email.value.trim(), password.value);
    router.push("/");
  } catch (e) {
    error.value = getErrorMessage(e);
  }
}
</script>

<template>
  <div class="authBox">
    <h1>Prisijungimas</h1>

    <form @submit.prevent="submit" style="display:grid;gap:12px;">
      <input
        v-model="email"
        type="email"
        placeholder="el. paštas"
        required
        :disabled="loading"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Slaptažodis"
        required
        :disabled="loading"
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Prisijungiama..." : "Prisijungti" }}
      </button>

      <p v-if="error" style="color:red">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.authBox {
  max-width: 420px;
  margin: 40px auto;
}
</style>
