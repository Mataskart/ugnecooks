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
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.head__actions {
  display: flex;
  gap: 10px;
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
