<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listRecipes, type RecipeListItem } from "../recipes";

/**
 * Public recipes list page.
 * Uses GET /api/recipes (no auth required).
 *
 * Displays coverImageUrl thumbnails when present.
 */

const q = ref("");
const loading = ref(true);
const error = ref("");
const recipes = ref<RecipeListItem[]>([]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    recipes.value = await listRecipes(q.value);
  } catch (e: any) {
    error.value = e?.message ?? "Nepavyko užkrauti receptų";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page__head">
      <div>
        <h1>Receptai</h1>
        <p class="muted">Naršykite visus paskelbtus receptus.</p>
      </div>

      <form class="search" @submit.prevent="load">
        <input
          v-model="q"
          placeholder="Paieška..."
          :disabled="loading"
          aria-label="Paieška"
        />
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? "…" : "Ieškoti" }}
        </button>
      </form>
    </div>

    <p v-if="loading" class="muted">Kraunama...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <div v-else class="grid">
      <router-link
        v-for="r in recipes"
        :key="r.id"
        class="card"
        :to="`/recipes/${r.slug}`"
      >
        <div class="thumb" :class="{ 'thumb--empty': !r.coverImageUrl }">
          <img
            v-if="r.coverImageUrl"
            class="thumb__img"
            :src="r.coverImageUrl"
            :alt="`${r.title} cover`"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div v-else class="thumb__placeholder">
            <span aria-hidden="true">🍲</span>
          </div>
        </div>

        <div class="card__title">{{ r.title }}</div>

        <div v-if="r.description" class="card__desc">{{ r.description }}</div>
        <div v-else class="card__desc muted">Aprašymo nėra.</div>

        <div class="card__meta">
          <span class="muted">Atnaujinta {{ new Date(r.updatedAt).toLocaleDateString() }}</span>
        </div>
      </router-link>

      <div v-if="recipes.length === 0" class="empty">
        Receptų dar nėra.
      </div>
    </div>
  </section>
</template>

<style scoped>
.page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

/* keep header aligned left like the cards */
.page__head > div {
  flex: 1;
  min-width: 0;
  text-align: left;
}

h1 {
  margin: 0;
  font-size: 30px;
  text-align: left;
  line-height: 1.1;
}

.search {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* IMPORTANT: use the global light-theme input styling */
.search input {
  width: 260px;
  max-width: 100%;
}

/* add a nicer focus ring (cookbook-y) */
.search input:focus {
  outline: none;
  border-color: rgba(255, 95, 166, 0.35);
  box-shadow: 0 0 0 4px rgba(255, 95, 166, 0.12);
}

.search input:disabled {
  opacity: 0.65;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

/* Cards now match the new theme */
.card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-xl);
  text-decoration: none;
  color: inherit;

  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);

  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}

.card:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16px 38px rgba(43, 27, 26, 0.12);
}

.thumb {
  width: 100%;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb--empty {
  display: grid;
  place-items: center;
}

.thumb__placeholder {
  color: rgba(43, 27, 26, 0.55);
  font-size: 28px;
}

.card__title {
  font-weight: 800;
  font-size: 16px;
  color: rgba(43, 27, 26, 0.92);
}

.card__desc {
  font-size: 14px;
  line-height: 1.45;
  color: rgba(43, 27, 26, 0.80);
}

.card__meta {
  margin-top: 2px;
  font-size: 12px;
}

/* Empty state */
.empty {
  grid-column: 1 / -1;
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px dashed rgba(43, 27, 26, 0.20);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(43, 27, 26, 0.70);
}

/* Responsive */
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .page__head {
    flex-direction: column;
    align-items: stretch;
  }
  .search {
    width: 100%;
  }
  .search input {
    width: 100%;
    flex: 1;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
