<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createRecipe } from "../../recipes";

/**
 * Admin create recipe form (POST /api/recipes)
 * Creates a recipe that becomes publicly visible immediately.
 */

const router = useRouter();

const title = ref("");
const description = ref("");
const coverImageUrl = ref("");
const ingredients = ref("");
const instructions = ref("");

const saving = ref(false);
const error = ref("");

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const created = await createRecipe({
      title: title.value,
      description: description.value || undefined,
      coverImageUrl: coverImageUrl.value || undefined,
      ingredients: ingredients.value,
      instructions: instructions.value,
    });

    // After creating, go to edit page (or to public view if you prefer)
    router.push(`/admin/recipes/${created.id}/edit`);
  } catch (e: any) {
    error.value = e?.message ?? "Create failed";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="page">
    <div class="head">
      <div>
        <h1>Admin · Naujas receptas</h1>
        <p class="muted">Sukuriamas receptas bus viešai matomas.</p>
      </div>
      <router-link class="btn btn--ghost" to="/admin/recipes">Atgal</router-link>
    </div>

    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field__label">Pavadinimas</span>
        <input
          v-model="title"
          required
          minlength="2"
          maxlength="120"
          placeholder="e.g., Pasta"
          :disabled="saving"
        />
      </label>

      <label class="field">
        <span class="field__label">Aprašymas (nebūtina)</span>
        <input v-model="description" placeholder="Short summary…" :disabled="saving" />
      </label>

      <label class="field">
        <span class="field__label">Viršelio paveikslėlio nuoroda URL (nebūtina)</span>
        <input v-model="coverImageUrl" placeholder="https://…" :disabled="saving" />
      </label>

      <label class="field">
        <span class="field__label">Ingredientai</span>
        <textarea
          v-model="ingredients"
          required
          rows="8"
          placeholder="- noodles&#10;- salt"
          :disabled="saving"
        ></textarea>
      </label>

      <label class="field">
        <span class="field__label">Gaminimo eiga</span>
        <textarea
          v-model="instructions"
          required
          rows="10"
          placeholder="1) Boil water…"
          :disabled="saving"
        ></textarea>
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button class="btn" type="submit" :disabled="saving">
          {{ saving ? "Saugoma..." : "Pridėti receptą" }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
h1 {
  margin: 0;
  font-size: 28px;
}
.muted {
  color: rgba(233, 236, 241, 0.68);
}
.error {
  color: #ffb4b4;
}

.form {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.field {
  display: grid;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  color: rgba(233, 236, 241, 0.75);
}

input,
textarea {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
}

input:disabled,
textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.15);
  color: inherit;
  cursor: pointer;
}
.btn--ghost {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
