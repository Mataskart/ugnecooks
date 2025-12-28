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
.back {
  display: inline-block;
  margin-bottom: 14px;
  color: rgba(233, 236, 241, 0.75);
  text-decoration: none;
}
.back:hover {
  color: rgba(233, 236, 241, 0.95);
}

h1 {
  margin: 0 0 8px;
  font-size: 30px;
}

h2 {
  margin: 0 0 10px;
  font-size: 16px;
}

.muted {
  color: rgba(233, 236, 241, 0.68);
}

.error {
  color: #ffb4b4;
}

.recipe {
  display: grid;
  gap: 16px;
}

.cover {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.cover__img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}

.recipe__head {
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.box {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.content {
  margin: 0;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(233, 236, 241, 0.9);
}

@media (max-width: 900px) {
  .cols {
    grid-template-columns: 1fr;
  }
  .cover__img {
    height: 220px;
  }
}
</style>
