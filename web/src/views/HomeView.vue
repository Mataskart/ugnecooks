<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listRecipes, type RecipeListItem } from "../recipes";

/**
 * Pagrindinis puslapis:
 * - CTA į receptų sąrašą
 * - Naujausių receptų peržiūra (vieša)
 */

const loading = ref(true);
const error = ref("");
const latest = ref<RecipeListItem[]>([]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const all = await listRecipes("");
    latest.value = all.slice(0, 6);
  } catch (e: any) {
    error.value = e?.message ?? "Nepavyko užkrauti receptų";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="hero">
    <div class="hero__card">
      <header class="hero__head">
        <div class="hero__title">
          <h1>Greitai raskite receptus</h1>
        </div>

        <router-link class="btn" to="/recipes">Peržiūrėti receptus</router-link>
      </header>

      <div class="divider"></div>

      <h2 class="section-title">Naujausi receptai</h2>

      <p v-if="loading" class="muted">Kraunama...</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <div v-else class="grid">
        <router-link
          v-for="r in latest"
          :key="r.id"
          class="card"
          :to="`/recipes/${r.slug}`"
        >
          <div class="thumb" :class="{ 'thumb--empty': !r.coverImageUrl }">
            <img
              v-if="r.coverImageUrl"
              class="thumb__img"
              :src="r.coverImageUrl"
              :alt="`${r.title} nuotrauka`"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <div v-else class="thumb__placeholder">
              <span aria-hidden="true">🍲</span>
            </div>
          </div>

          <div class="card__title">{{ r.title }}</div>
          <div class="card__meta muted">
            Atnaujinta {{ new Date(r.updatedAt).toLocaleDateString() }}
          </div>
        </router-link>

        <div v-if="latest.length === 0" class="empty">
          Receptų dar nėra. Pradėkite nuo skilties „Receptai“.
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 10px 0;
}

/* IMPORTANT: clip any internal overflow (grid/cards/shadows) */
.hero__card {
  width: 100%;
  max-width: 100%;
  border-radius: 18px;
  padding: 18px;

  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  overflow: hidden; /* prevents "spilling out of background" */
}

.hero__head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.hero__title {
  min-width: 0;
}

h1 {
  margin: 0 0 6px;
  font-size: clamp(26px, 6.5vw, 34px);
  line-height: 1.15;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 16px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;

  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  min-width: 0; /* helps prevent overflow */
}

.card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.14);
}

.thumb {
  width: 100%;
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
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
  color: rgba(233, 236, 241, 0.8);
  font-size: 26px;
}

.card__title {
  font-weight: 700;
  font-size: 16px;
}

.card__meta {
  font-size: 12px;
}

.empty {
  grid-column: 1 / -1;
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(233, 236, 241, 0.75);
}


@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .hero__head {
    flex-direction: column;
    align-items: stretch;
  }
  .btn {
    width: fit-content;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
