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
          placeholder="Pvz., Pasta"
          :disabled="saving"
        />
      </label>

      <label class="field">
        <span class="field__label">Aprašymas (nebūtina)</span>
        <input v-model="description" placeholder="Trumpai apie receptą…" :disabled="saving" />
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
          placeholder="- makaronai&#10;- druska"
          :disabled="saving"
        ></textarea>
      </label>

      <label class="field">
        <span class="field__label">Gaminimo eiga</span>
        <textarea
          v-model="instructions"
          required
          rows="10"
          placeholder="1) Užvirkite vandenį…"
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
  font-size: 32px;
  line-height: 1.1;
  color: rgba(43, 27, 26, 0.92);
}

.form {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.field {
  display: grid;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(43, 27, 26, 0.70);
}

/* Use global input styles, but keep nice focus ring */
input,
textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(43, 27, 26, 0.16);
  color: rgba(43, 27, 26, 0.92);
}

input::placeholder,
textarea::placeholder {
  color: rgba(43, 27, 26, 0.45);
}

input:focus,
textarea:focus {
  outline: none;
  border-color: rgba(255, 95, 166, 0.35);
  box-shadow: 0 0 0 4px rgba(255, 95, 166, 0.12);
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* Mobile: stack header button under title if needed */
@media (max-width: 620px) {
  .head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
