import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/db-check", async (req, res) => {
  const count = await prisma.user.count();
  res.json({ ok: true, userCount: count });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
