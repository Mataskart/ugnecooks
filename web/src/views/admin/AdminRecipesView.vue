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
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-left: 14px;
  padding-right: 14px;
}

/* Make the left side of the header align with the list content */
.head > div {
  flex: 1;
  min-width: 0;
  text-align: left;
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

.list {
  display: grid;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.row__main {
  flex: 1;
  min-width: 0;          /* prevents overflow pushing layout weirdly */
  text-align: left;      /* <-- main fix: no more centered titles */
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* ensures left alignment even if parent tries centering */
}


.row__title {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row__meta {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
}

.btn--danger {
  border-color: rgba(255, 80, 80, 0.45);
  background: rgba(255, 80, 80, 0.12);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty {
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(233, 236, 241, 0.75);
}

@media (max-width: 680px) {
  .head {
    flex-direction: column;
    align-items: stretch;
  }
  .row {
    flex-direction: column;
    align-items: flex-start;
  }
  .row__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
