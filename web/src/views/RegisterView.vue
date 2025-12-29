<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../auth";

type ApiLikeError = {
  message?: string;
  data?: { error?: string };
};

const router = useRouter();
const { register, loading } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");

function getErrorMessage(e: unknown): string {
  const anyErr = e as ApiLikeError | null;

  if (anyErr?.data?.error) return String(anyErr.data.error);
  if (anyErr?.message) return String(anyErr.message);

  return "Registracija nepavyko";
}

async function submit() {
  if (loading.value) return; // safety guard
  error.value = "";

  try {
    await register(email.value.trim(), password.value);
    router.push("/");
  } catch (e) {
    error.value = getErrorMessage(e);
  }
}
</script>

<template>
  <div class="authBox">
    <h1>Registracija</h1>

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
        placeholder="Slaptažodis (min 8 simboliai)"
        minlength="8"
        required
        :disabled="loading"
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Kuriama paskyra…" : "Sukurti paskyrą" }}
      </button>

      <p v-if="error" style="color:red">{{ error }}</p>
    </form>
  </div>
</template>
