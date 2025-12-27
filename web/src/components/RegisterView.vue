<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../auth";

const router = useRouter();
const { register } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await register(email.value, password.value);
    router.push("/");
  } catch (e) {
    error.value = e?.data?.error || e.message;
  }
}
</script>

<template>
  <div style="max-width:420px;margin:40px auto;">
    <h1>Register</h1>

    <form @submit.prevent="submit" style="display:grid;gap:12px;">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password (min 8)" minlength="8" required />
      <button>Create account</button>

      <p v-if="error" style="color:red">{{ error }}</p>
    </form>
  </div>
</template>
