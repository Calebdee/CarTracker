import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ====== ENV VARS ======
const ACCESS_PIN = process.env.ACCESS_PIN || "4969";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ====== DATABASE CONNECTION ======
const db = await mysql.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  socketPath: "/var/run/mysqld/mysqld10.sock",
});

// Ensure upload folder exists
const uploadDir = "/app/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(uploadDir));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = "img_" + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// ====== AUTH ROUTE ======
app.post("/api/auth/check-pin", (req, res) => {
  console.log("REQUEST BODY:", req.body);

  const pin = req.body.pin || req.body.code;

  if (!pin) {
    return res.status(400).json({ success: false, message: "PIN missing" });
  }

  if (pin.toString() !== ACCESS_PIN) {
    return res.status(401).json({ success: false, message: "Invalid PIN" });
  }

  const token = jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: "24h" });
  return res.json({ success: true, token });
});

// ====== AUTH MIDDLEWARE ======
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ====== HEALTH CHECK ======
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===================================================================
// ===============     VEHICLE ROUTES (CRUD)    =======================
// ===================================================================

// ----- GET all vehicles -----
app.get("/api/vehicles", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vehicles ORDER BY id DESC");
    console.log("Number of rows in GetVehicles:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error("GET vehicles error:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// ----- GET one vehicle -----
app.get("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM vehicles WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET vehicle error:", err);
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
});

// ----- CREATE vehicle -----
app.post("/api/vehicles", requireAuth, async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      vin,
      plate,
      purchase_date,
      purchase_mileage,
      picture_url,
      trim,
      purchase_type,
      nickname,
      color,
    } = req.body;


    const [result] = await db.query(
      `INSERT INTO vehicles 
      (make, model, year, vin, plate, purchase_date, purchase_mileage, picture_url, trim, purchase_type, nickname, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        make,
        model,
        year,
        vin,
        plate,
        purchase_date,
        purchase_mileage,
        picture_url,
        trim,
        purchase_type,
        nickname,
        color,
      ]
    );

    res.json({ id: result.insertId, success: true });
  } catch (err) {
    console.error("CREATE vehicle error:", err);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});

// ----- UPDATE vehicle -----
app.put("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      make,
      model,
      year,
      vin,
      plate,
      purchase_date,
      purchase_mileage,
      picture_url,
    } = req.body;

    await db.query(
      `UPDATE vehicles SET 
        make=?, model=?, year=?, vin=?, plate=?, 
        purchase_date=?, purchase_mileage=?, picture_url=?
       WHERE id=?`,
      [
        make,
        model,
        year,
        vin,
        plate,
        purchase_date,
        purchase_mileage,
        picture_url,
        id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE vehicle error:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// ----- DELETE vehicle -----
app.delete("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM vehicles WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE vehicle error:", err);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({ success: true, url: fileUrl });
});

// ===================================================================

// ====== START SERVER ======
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running on port ${port}`));

