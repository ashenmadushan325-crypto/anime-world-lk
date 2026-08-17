
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";

const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { manga: [] };
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { manga: [] }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function id() { return crypto.randomUUID(); }

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 60 },
  fileFilter: (_, file, cb) => {
    const ok = /image\/(jpeg|png|webp|gif)/.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed."), ok);
  }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "replace-this-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Admin login required." });
  next();
}

app.get("/api/manga", (req, res) => {
  const db = loadDB();
  const q = String(req.query.q || "").toLowerCase().trim();
  const list = db.manga
    .filter(m => !q || m.title.toLowerCase().includes(q))
    .map(m => ({ ...m, chapters: m.chapters.map(c => ({ id: c.id, name: c.name, pages: c.pages.length })) }));
  res.json(list);
});

app.get("/api/manga/:id", (req, res) => {
  const m = loadDB().manga.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Manga not found." });
  res.json(m);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid username or password." });
});
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get("/api/me", (req, res) => res.json({ admin: !!req.session.admin }));

app.post("/api/manga", requireAdmin, upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "pages", maxCount: 60 }
]), (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const chapterName = String(req.body.chapterName || "Chapter 01").trim();
  if (!title) return res.status(400).json({ error: "Title is required." });

  const cover = req.files?.cover?.[0];
  const pages = (req.files?.pages || []).map(f => `/uploads/${f.filename}`);
  const manga = {
    id: id(),
    title,
    description,
    cover: cover ? `/uploads/${cover.filename}` : "",
    createdAt: new Date().toISOString(),
    chapters: [{ id: id(), name: chapterName, pages }]
  };
  const db = loadDB();
  db.manga.unshift(manga);
  saveDB(db);
  res.json({ ok: true, manga });
});

app.post("/api/manga/:id/chapter", requireAdmin, upload.array("pages", 60), (req, res) => {
  const db = loadDB();
  const manga = db.manga.find(x => x.id === req.params.id);
  if (!manga) return res.status(404).json({ error: "Manga not found." });
  const name = String(req.body.name || `Chapter ${String(manga.chapters.length + 1).padStart(2, "0")}`);
  const pages = req.files.map(f => `/uploads/${f.filename}`);
  manga.chapters.push({ id: id(), name, pages });
  saveDB(db);
  res.json({ ok: true });
});

app.delete("/api/manga/:id", requireAdmin, (req, res) => {
  const db = loadDB();
  const m = db.manga.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Manga not found." });
  const files = [];
  if (m.cover) files.push(path.basename(m.cover));
  for (const c of m.chapters) for (const p of c.pages) files.push(path.basename(p));
  for (const f of files) {
    const p = path.join(UPLOAD_DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.manga = db.manga.filter(x => x.id !== m.id);
  saveDB(db);
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed." });
});

app.listen(PORT, () => console.log(`ඇනිමි WORLD running at http://localhost:${PORT}`));
