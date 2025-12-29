<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getRecipe, type RecipeDetail } from "../recipes";

/**
 * Public recipe detail page.
 * Loads by slug from route param.
 */

const route = useRoute();
const slug = String(route.params.slug || "");

const loading = ref(true);
const error = ref("");
const recipe = ref<RecipeDetail | null>(null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    recipe.value = await getRecipe(slug);
  } catch (e: any) {
    error.value = e?.message ?? "Nepavyko užkrauti recepto";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <router-link class="back" to="/recipes">← Grįžti į receptus</router-link>

    <p v-if="loading" class="muted">Kraunama…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <article v-else-if="recipe" class="recipe">
      <!-- Cover image -->
      <div v-if="recipe.coverImageUrl" class="cover">
        <img
          class="cover__img"
          :src="recipe.coverImageUrl"
          :alt="`${recipe.title} cover`"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
      </div>

      <header class="recipe__head">
        <h1>{{ recipe.title }}</h1>
        <p v-if="recipe.description" class="muted">{{ recipe.description }}</p>
      </header>

      <div class="cols">
        <section class="box">
          <h2>Ingridientai</h2>
          <pre class="content">{{ recipe.ingredients }}</pre>
        </section>

        <section class="box">
          <h2>Gaminimo eiga</h2>
          <pre class="content">{{ recipe.instructions }}</pre>
        </section>
      </div>
    </article>
  </section>
</template>

<style scoped>
/* Use the new global tokens from style.css (light theme) */
.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  text-decoration: none;
  color: rgba(43, 27, 26, 0.72);
  font-weight: 600;
}
.back:hover {
  color: rgba(43, 27, 26, 0.92);
}

h1 {
  margin: 0 0 8px;
  font-size: 32px;
  line-height: 1.1;
}

h2 {
  margin: 0 0 10px;
  font-size: 16px;
}

.recipe {
  display: grid;
  gap: 16px;
}

.cover {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.cover__img {
  width: 100%;
  height: 340px;
  object-fit: cover;
  display: block;
}

.recipe__head {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.box {
  padding: 16px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

/* IMPORTANT: your old .content color was nearly-white; fixed for light theme */
.content {
  margin: 0;
  white-space: pre-wrap;

  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.55;

  color: rgba(43, 27, 26, 0.88);
}

@media (max-width: 900px) {
  .cols {
    grid-template-columns: 1fr;
  }
  .cover__img {
    height: 240px;
  }
}
</style>
