<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getRecipe, updateRecipe, type RecipeDetail } from "../../recipes";

/**
 * Admin edit recipe form.
 * Loads via GET /api/recipes/:idOrSlug (we use :id)
 * Saves via PUT /api/recipes/:id
 */

const route = useRoute();
const router = useRouter();
const id = String(route.params.id || "");

const loading = ref(true);
const saving = ref(false);
const error = ref("");

const recipe = ref<RecipeDetail | null>(null);

const title = ref("");
const description = ref("");
const coverImageUrl = ref("");
const ingredients = ref("");
const instructions = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const r = await getRecipe(id);
    recipe.value = r;

    // Populate form fields
    title.value = r.title;
    description.value = r.description ?? "";
    coverImageUrl.value = r.coverImageUrl ?? "";
    ingredients.value = r.ingredients;
    instructions.value = r.instructions;
  } catch (e: any) {
    error.value = e?.message ?? "Nepavyko užkrauti recepto";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const updated = await updateRecipe(id, {
      title: title.value,
      description: description.value || null,
      coverImageUrl: coverImageUrl.value || null,
      ingredients: ingredients.value,
      instructions: instructions.value,
    });

    // Title edits might change slug; show the updated public page in one click
    recipe.value = recipe.value ? { ...recipe.value, slug: updated.slug, title: title.value } : recipe.value;
    alert("Saved!");
  } catch (e: any) {
    error.value = e?.message ?? "Save failed";
  } finally {
    saving.value = false;
  }
}

function goPublic() {
  if (!recipe.value) return;
  router.push(`/recipes/${recipe.value.slug}`);
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="head">
      <div>
        <h1>Admin · Redaguoti receptą</h1>
        <p class="muted" v-if="recipe">id: {{ recipe.id }} · slug: {{ recipe.slug }}</p>
      </div>

      <div class="head__actions">
        <button class="btn btn--ghost" @click="goPublic" :disabled="!recipe">Peržiūrėti viešą vaizdą</button>
        <router-link class="btn btn--ghost" to="/admin/recipes">Atgal</router-link>
      </div>
    </div>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <form v-else class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field__label">Pavadinimas</span>
        <input v-model="title" required minlength="2" maxlength="120" />
      </label>

      <label class="field">
        <span class="field__label">Aprašymas (nebūtina)</span>
        <input v-model="description" />
      </label>

      <label class="field">
        <span class="field__label">Viršelio paveikslėlio nuoroda URL (nebūtina)</span>
        <input v-model="coverImageUrl" />
      </label>

      <label class="field">
        <span class="field__label">Ingredientai</span>
        <textarea v-model="ingredients" required rows="8"></textarea>
      </label>

      <label class="field">
        <span class="field__label">Gaminimo eiga</span>
        <textarea v-model="instructions" required rows="10"></textarea>
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button class="btn" type="submit" :disabled="saving">
          {{ saving ? "Saving…" : "Išsaugot pakeitimus" }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* Header: responsive grid so title doesn't get crushed by actions */
.head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  /* important: allow the left side to shrink properly */
  min-width: 0;
}

.head > div {
  min-width: 0;
  text-align: left;
}

h1 {
  margin: 0;
  font-size: clamp(20px, 5.5vw, 28px);
  line-height: 1.15;

  /* prevent silly letter-by-letter breaks */
  overflow-wrap: normal;
  word-break: normal;
  hyphens: auto;
}

.muted {
  color: rgba(233, 236, 241, 0.68);

  /* long ids/slugs should wrap, but not destroy the heading */
  overflow-wrap: anywhere;
}

.error {
  color: #ffb4b4;
}

/* Actions: wrap and never force overflow */
.head__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: flex-start;

  min-width: 0;
}

/* Make the buttons a bit more compact in the header */
.head__actions :deep(.btn) {
  padding: 8px 10px;
  font-size: 13px;
  white-space: nowrap;
}

/* Form (keep your existing look) */
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

.actions {
  display: flex;
  justify-content: flex-end;
}

/* Stack actions under title on mobile */
@media (max-width: 680px) {
  .head {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .head__actions {
    justify-content: flex-start;
  }

  /* optional: make the primary action full-width on small screens */
  .head__actions :deep(.btn) {
    width: fit-content;
  }
}

/* Extreme narrow screens: make actions two columns, then one */
@media (max-width: 360px) {
  .head__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .head__actions :deep(.btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 260px) {
  .head__actions {
    grid-template-columns: 1fr;
  }
}
</style>
