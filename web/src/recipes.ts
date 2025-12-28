/**
 * Recipes API client (frontend).
 * Public reads:
 * - GET /api/recipes
 * - GET /api/recipes/:idOrSlug
 * Admin writes:
 * - POST/PUT/DELETE /api/recipes
 */

import { api } from "./api";

export type RecipeListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDetail = RecipeListItem & {
  ingredients: string;
  instructions: string;
};

type ApiOk<T> = { ok: true } & T;

export async function listRecipes(q = ""): Promise<RecipeListItem[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const data = await api<ApiOk<{ recipes: RecipeListItem[] }>>(`/api/recipes${qs}`);
  return data.recipes;
}

export async function getRecipe(idOrSlug: string): Promise<RecipeDetail> {
  const data = await api<ApiOk<{ recipe: RecipeDetail }>>(`/api/recipes/${encodeURIComponent(idOrSlug)}`);
  return data.recipe;
}

export async function createRecipe(input: {
  title: string;
  description?: string;
  ingredients: string;
  instructions: string;
  coverImageUrl?: string;
}): Promise<{ id: string; slug: string }> {
  const data = await api<ApiOk<{ recipe: { id: string; slug: string } }>>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.recipe;
}

export async function updateRecipe(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    ingredients: string;
    instructions: string;
    coverImageUrl: string | null;
  }>
): Promise<{ id: string; slug: string }> {
  const data = await api<ApiOk<{ recipe: { id: string; slug: string } }>>(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  await api<ApiOk<{}>>(`/api/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
