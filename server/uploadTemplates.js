import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pkg from "pg";

const { Pool } = pkg;

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load .env from root
dotenv.config({ path: path.join(rootDir, ".env") });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Postgres connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function uploadTemplates() {
  const templatesDir = path.join(__dirname, "templates");
  const files = fs.readdirSync(templatesDir);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "meme_templates",
      });

      console.log(`✅ Uploaded: ${result.secure_url}`);

      // Insert into DB
      await pool.query(
        "INSERT INTO meme_templates (name, url) VALUES ($1, $2)",
        [file, result.secure_url]
      );

      console.log(`📦 Saved to DB: ${file}`);
    } catch (err) {
      console.error(`❌ Error with ${file}:`, err);
    }
  }

  await pool.end();
}

uploadTemplates();
