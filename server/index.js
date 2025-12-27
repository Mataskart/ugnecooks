import "dotenv/config";
import express from "express";
import cookieSession from "cookie-session";
import argon2 from "argon2";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js";

const app = express();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing in environment (.env)");
}

// Needed so secure cookies work behind Nginx (TLS terminates at Nginx)
app.set("trust proxy", 1);

app.use(express.json());

const isProd = process.env.NODE_ENV === "production";

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

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check server/.env");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
