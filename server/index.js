/**
 * UgneCooks API (Express + Prisma v7 + cookie-session auth)
 *
 * - Loads .env reliably (Windows + Linux) from server/.env
 * - Uses Postgres via Prisma v7 Adapter (@prisma/adapter-pg)
 * - Session auth via cookie-session + argon2 passwords
 * - Public endpoints: health, db-check, recipes list/detail
 * - Auth endpoints: register, login, logout, me
 * - Admin-only endpoints: create/update/delete recipes
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- Environment -------------------------------------------------------------

// Build a real filesystem path to ./server/.env (works on Windows + Linux)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// --- Imports -----------------------------------------------------------------

import express from "express";
import cookieSession from "cookie-session";
import argon2 from "argon2";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js";

// --- App setup ---------------------------------------------------------------

const app = express();
app.use(express.json());

// Needed so secure cookies work behind Nginx (TLS terminates at Nginx)
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// --- Required env checks -----------------------------------------------------

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing in environment (.env)");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check server/.env");
}

// --- Session cookies ---------------------------------------------------------

app.use(
  cookieSession({
    name: "ugnecooks.sid",
    secret: process.env.SESSION_SECRET,
    httpOnly: true,
    secure: isProd, // true on VPS (https), false locally (http)
    sameSite: "lax",
    path: "/",
  })
);

// --- Prisma (Postgres) -------------------------------------------------------

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- Helpers ----------------------------------------------------------------

/**
 * Returns a safe user object for sending to frontend.
 * (Includes role so frontend can show admin UI later.)
 */
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role, // NEW: for admin UX
    createdAt: user.createdAt,
  };
}

/**
 * Basic slug generator (simple, stable).
 * NOTE: This is intentionally ASCII-only for v1.
 */
function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Minimal validation helper for string fields.
 */
function assertString(name, value, { min = 1, max = 50000 } = {}) {
  if (typeof value !== "string") return `${name} must be a string`;
  const v = value.trim();
  if (v.length < min) return `${name} is required`;
  if (v.length > max) return `${name} is too long (max ${max})`;
  return null;
}

/**
 * Middleware: require admin session.
 * - 401 if not logged in
 * - 403 if logged in but not admin
 */
function makeRequireAdmin(prismaClient) {
  return async function requireAdmin(req, res, next) {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Not authenticated" });

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      req.session = null;
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }
    if (user.role !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Admin only" });
    }

    req.user = user; // optional convenience
    next();
  };
}

const requireAdmin = makeRequireAdmin(prisma);

// --- Core / health -----------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/db-check", async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ ok: true, userCount: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// --- Auth --------------------------------------------------------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ ok: false, error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }

    const passwordHash = await argon2.hash(password);

    // role defaults to USER in schema (admins are promoted manually in DB)
    const user = await prisma.user.create({ data: { email, passwordHash } });

    req.session.userId = user.id;
    return res.status(201).json({ ok: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Login failed" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session = null;
  return res.json({ ok: true });
});

app.get("/api/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ ok: false, user: null });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      req.session = null;
      return res.status(401).json({ ok: false, user: null });
    }

    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Me failed" });
  }
});

/**
 * Convenience endpoint for the frontend:
 * Returns whether the current session user is an admin.
 * - If not logged in → isAdmin: false
 * - If logged in → isAdmin based on User.role
 */
app.get("/api/admin/status", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.json({ ok: true, isAdmin: false });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return res.json({ ok: true, isAdmin: user?.role === "ADMIN" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Admin status failed" });
  }
});


// --- Recipes (Public read, Admin write) --------------------------------------

/**
 * PUBLIC: List recipes
 * Query params:
 * - q: optional search string (title/description)
 * - take: optional limit (default 20, max 50)
 */
app.get("/api/recipes", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const take = Math.min(parseInt(req.query.take || "20", 10) || 20, 50);

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const recipes = await prisma.recipe.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({ ok: true, recipes });
});

/**
 * PUBLIC: Get recipe by ID or slug
 */
app.get("/api/recipes/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;

  const recipe = await prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      ingredients: true,
      instructions: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recipe) return res.status(404).json({ ok: false, error: "Recipe not found" });
  res.json({ ok: true, recipe });
});

/**
 * ADMIN: Create recipe
 */
app.post("/api/recipes", requireAdmin, async (req, res) => {
  const { title, description, ingredients, instructions, coverImageUrl } = req.body ?? {};

  const e1 = assertString("title", title, { min: 2, max: 120 });
  const e2 = assertString("ingredients", ingredients, { min: 1, max: 20000 });
  const e3 = assertString("instructions", instructions, { min: 1, max: 50000 });
  if (e1 || e2 || e3) return res.status(400).json({ ok: false, error: e1 || e2 || e3 });

  const baseSlug = slugify(title);
  if (!baseSlug) return res.status(400).json({ ok: false, error: "Invalid title for slug" });

  // Ensure unique slug
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const hit = await prisma.recipe.findUnique({ where: { slug }, select: { id: true } });
    if (!hit) break;
    slug = `${baseSlug}-${i}`;
  }

  const created = await prisma.recipe.create({
    data: {
      title: title.trim(),
      slug,
      description: typeof description === "string" ? description.trim() : null,
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl.trim() : null,
      authorId: req.session.userId,
    },
    select: { id: true, slug: true },
  });

  res.status(201).json({ ok: true, recipe: created });
});

/**
 * ADMIN: Update recipe
 * - If title is provided, slug is regenerated (unique).
 * - Supports partial updates for convenience.
 */
app.put("/api/recipes/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, ingredients, instructions, coverImageUrl } = req.body ?? {};

  const existing = await prisma.recipe.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return res.status(404).json({ ok: false, error: "Recipe not found" });

  // Validate optional fields if present
  if (title !== undefined) {
    const e = assertString("title", title, { min: 2, max: 120 });
    if (e) return res.status(400).json({ ok: false, error: e });
  }
  if (ingredients !== undefined) {
    const e = assertString("ingredients", ingredients, { min: 1, max: 20000 });
    if (e) return res.status(400).json({ ok: false, error: e });
  }
  if (instructions !== undefined) {
    const e = assertString("instructions", instructions, { min: 1, max: 50000 });
    if (e) return res.status(400).json({ ok: false, error: e });
  }

  // If title changes, also update slug uniquely
  let slugUpdate;
  if (typeof title === "string") {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const hit = await prisma.recipe.findUnique({ where: { slug }, select: { id: true } });
      if (!hit || hit.id === id) break;
      slug = `${baseSlug}-${i}`;
    }
    slugUpdate = slug;
  }

  const updated = await prisma.recipe.update({
    where: { id },
    data: {
      ...(typeof title === "string" ? { title: title.trim(), slug: slugUpdate } : {}),
      ...(description !== undefined
        ? { description: typeof description === "string" ? description.trim() : null }
        : {}),
      ...(typeof ingredients === "string" ? { ingredients: ingredients.trim() } : {}),
      ...(typeof instructions === "string" ? { instructions: instructions.trim() } : {}),
      ...(coverImageUrl !== undefined
        ? { coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl.trim() : null }
        : {}),
    },
    select: { id: true, slug: true },
  });

  res.json({ ok: true, recipe: updated });
});

/**
 * ADMIN: Delete recipe
 */
app.delete("/api/recipes/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.recipe.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return res.status(404).json({ ok: false, error: "Recipe not found" });

  await prisma.recipe.delete({ where: { id } });
  res.json({ ok: true });
});

// --- Startup ----------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
