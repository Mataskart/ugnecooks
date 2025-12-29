<script setup lang="ts">
import { onMounted, ref } from "vue";
import { deleteRecipe, listRecipes, type RecipeListItem } from "../../recipes";
import { useRouter } from "vue-router";

/**
 * Admin recipes management list:
 * - shows all recipes (public list endpoint)
 * - allows delete (admin endpoint)
 * - allows navigation to edit/new
 */

const router = useRouter();

const loading = ref(true);
const error = ref("");
const recipes = ref<RecipeListItem[]>([]);
const busyId = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    recipes.value = await listRecipes("");
  } catch (e: any) {
    error.value = e?.message ?? "Nepavyko užkrauti receptų";
  } finally {
    loading.value = false;
  }
}

async function onDelete(id: string) {
  if (!confirm("Ištrinti šį receptą?")) return;
  busyId.value = id;
  try {
    await deleteRecipe(id);
    await load();
  } catch (e: any) {
    alert(e?.message ?? "Ištrinti nepavyko");
  } finally {
    busyId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="head">
      <div>
        <h1>Admin · Receptai</h1>
        <p class="muted">Kurti, redaguoti ir trinti viešus receptus.</p>
      </div>

      <button class="btn" @click="router.push('/admin/recipes/new')" :disabled="loading">
        Naujas receptas
      </button>
    </div>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <div v-else class="list">
      <div v-if="recipes.length === 0" class="empty">Nėra receptų.</div>

      <div v-for="r in recipes" :key="r.id" class="row">
        <div class="row__main">
          <div class="row__title">{{ r.title }}</div>
          <div class="row__meta muted">
            slug: {{ r.slug }} · updated {{ new Date(r.updatedAt).toLocaleString() }}
          </div>
        </div>

        <div class="row__actions">
          <button class="btn btn--ghost" @click="router.push(`/recipes/${r.slug}`)">View</button>
          <button class="btn btn--ghost" @click="router.push(`/admin/recipes/${r.id}/edit`)">Edit</button>
          <button
            class="btn btn--danger"
            @click="onDelete(r.id)"
            :disabled="busyId === r.id"
          >
            {{ busyId === r.id ? "Deleting…" : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Header */
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

/* Ensure title area can shrink */
.head > div {
  flex: 1;
  min-width: 0;
  text-align: left;
}

h1 {
  margin: 0;
  font-size: clamp(20px, 5.5vw, 28px);
}

/* List */
.list {
  display: grid;
  gap: 10px;
}

/* Row becomes a responsive grid:
   - left side grows/shrinks
   - right side actions wrap */
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;

  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  min-width: 0; /* critical */
}

/* Left column */
.row__main {
  min-width: 0;
  text-align: left;
  display: grid;
  gap: 4px;
}

.row__title {
  font-weight: 700;

  /* allow shrink + ellipsis */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Actions: wrap and never force overflow */
.row__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: flex-start;

  min-width: 0;
}

/* Make buttons shrink nicely instead of pushing layout */
.row__actions :deep(.btn) {
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 13px;

  /* important: allow wrapping in extreme widths */
  white-space: normal;
  line-height: 1.1;
}

/* Empty state */
.empty {
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(233, 236, 241, 0.75);
}

/* Medium mobile: stack header + make actions left-aligned */
@media (max-width: 680px) {
  .head {
    flex-direction: column;
    align-items: stretch;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .row__actions {
    justify-content: flex-start;
  }
}

/* Extreme narrow screens: make actions a 2-column grid so nothing overflows */
@media (max-width: 360px) {
  .row__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .row__actions :deep(.btn) {
    width: 100%;
    justify-content: center;
  }
}

/* Ultra narrow (your 213px test): one button per line */
@media (max-width: 260px) {
  .row__actions {
    grid-template-columns: 1fr;
  }
}
</style>
