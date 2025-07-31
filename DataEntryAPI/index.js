const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
require("dotenv").config(); // ✅ Load .env file

const app = express();
const port = 4000;

// ✅ Enable CORS for all origins
app.use(cors());

// ✅ Middleware to parse JSON bodies
app.use(bodyParser.json());

// ✅ Logger middleware
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ✅ API Key middleware
const API_KEY = process.env.API_KEY;
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
  next();
});

// ✅ SQL Server config
const dbConfig = {
  user: "sa",
  password: "Pcuum@2022",
  server: "10.11.30.53",
  database: "Training1",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ API is running securely");
});

// ✅ Main API route to update SQL table
app.post("/api/update-sql", async (req, res) => {
  const updates = req.body;

  console.log("🛬 Received write-back request");
  console.log("📦 Payload:", JSON.stringify(updates, null, 2));

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "No update data received." });
  }

  try {
    const pool = await sql.connect(dbConfig);

    for (const item of updates) {
      const keyParts = item.key.split("|");

      if (keyParts.length !== 2) {
        console.warn("⚠️ Invalid key format:", item.key);
        continue;
      }

      const [stage, position] = keyParts.map((s) => s.trim());
      const column = item.column;
      const value = item.value;

      const query = `
        UPDATE DataEntry
        SET [${column}] = @value
        WHERE [Stage] = @stage AND [Competitive Position] = @position
      `;

      await pool
        .request()
        .input("value", typeof value === "number" ? sql.Float : sql.NVarChar, value)
        .input("stage", sql.NVarChar, stage)
        .input("position", sql.NVarChar, position)
        .query(query);
    }

    res.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("❌ SQL error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 API running securely at http://localhost:${port}`);
});
