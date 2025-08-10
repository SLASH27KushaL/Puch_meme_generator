import express from "express";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env (adjust path if needed)
dotenv.config({ path: path.join(__dirname, "../.env") });

const { Pool } = pkg;
const app = express();

// middleware
app.use(cors()); // allow frontend to fetch from another origin
app.use(express.json());

// Debug log env
console.log("Loaded DB config:");
console.log("Host:", process.env.DB_HOST);
console.log("Port:", process.env.DB_PORT);
console.log("User:", process.env.DB_USER);
console.log("Password length:", process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : "NOT SET");
console.log("Database:", process.env.DB_NAME);

// PostgreSQL connection pool (make sure port is a number)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test DB connection route (unchanged)
app.get("/test-db", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW()");
    res.json({ connected: true, now: r.rows[0].now });
  } catch (err) {
    console.error("test-db error:", err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

/**
 * GET /templates
 * Optional query: ?q=searchTerm
 * Returns array of { id, name, url, created_at }
 */
app.get("/templates", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (q) {
      const result = await pool.query(
        `SELECT id, name, url, created_at
         FROM meme_templates
         WHERE LOWER(name) LIKE $1
         ORDER BY created_at DESC`,
        [`%${q.toLowerCase()}%`]
      );
      return res.json(result.rows);
    } else {
      const result = await pool.query(
        `SELECT id, name, url, created_at
         FROM meme_templates
         ORDER BY created_at DESC`
      );
      return res.json(result.rows);
    }
  } catch (err) {
    console.error("GET /templates error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

/**
 * GET /templates/:id
 */
app.get("/templates/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await pool.query(
      "SELECT id, name, url, created_at FROM meme_templates WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /templates/:id error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

/**
 * POST /templates
 * Body: { name: string, url: string }
 * Simple helper so the frontend can add a template record when needed.
 */
app.post("/templates", async (req, res) => {
  try {
    const { name, url } = req.body || {};
    if (!name || !url) return res.status(400).json({ error: "Missing name or url" });

    const result = await pool.query(
      "INSERT INTO meme_templates (name, url) VALUES ($1, $2) RETURNING id, name, url, created_at",
      [name.toString().trim(), url.toString().trim()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /templates error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// Optional: a simple health route
app.get("/", (req, res) => res.send("Meme API is running"));

// Start server
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
