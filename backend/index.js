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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

app.get("/api/vehicle-parts/:id/attachments", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, url 
       FROM vehicle_part_attachments 
       WHERE vehicle_part_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Attachment fetch error:", err);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

app.get("/api/vehicle-parts/:partId", requireAuth, async (req, res) => {
  try {
    const partId = req.params.partId;

    const [[part]] = await db.query(
      `
      SELECT 
        id,
        vehicle_id,
        part_id,
        installation_date,
        installation_mileage,
        warranty_mileage,
        warranty_months,
        shop_location,
        notes,
        cost,
        estimated_life_mileage,
        estimated_life_months,
        type
      FROM vehicle_parts
      WHERE id = ?
      `,
      [partId]
    );

    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }

    res.json(part);

  } catch (err) {
    console.error("GET single vehicle part error:", err);
    res.status(500).json({ error: "Failed to load part" });
  }
});

app.put("/api/vehicle-parts/:partId", requireAuth, async (req, res) => {
  try {
    const partId = req.params.partId;

    const {
      installation_date,
      installation_mileage,
      warranty_mileage,
      warranty_months,
      shop_location,
      notes,
      cost,
      estimated_life_mileage,
      estimated_life_months,
      type
    } = req.body;

    await db.query(
      `
      UPDATE vehicle_parts
      SET
        installation_date = ?,
        installation_mileage = ?,
        warranty_mileage = ?,
        warranty_months = ?,
        shop_location = ?,
        notes = ?,
        cost = ?,
        estimated_life_mileage = ?,
        estimated_life_months = ?,
        type = ?
      WHERE id = ?
      `,
      [
        installation_date,
        installation_mileage,
        warranty_mileage,
        warranty_months,
        shop_location,
        notes,
        cost,
        estimated_life_mileage,
        estimated_life_months,
        type,
        partId
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("PUT update vehicle part error:", err);
    res.status(500).json({ error: "Failed to update part" });
  }
});

app.post("/api/vehicles/:vehicleId/odometer", requireAuth, async (req, res) => {
  const { vehicleId } = req.params;
  const { date, mileage } = req.body;

  if (!date || !mileage) {
    return res.status(400).json({ error: "date and mileage are required" });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO vehicle_odometer (vehicle_id, date, mileage)
       VALUES (?, ?, ?)`,
      [vehicleId, date, mileage]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Error inserting odometer:", err);
    res.status(500).json({ error: "DB insert failed" });
  }
});


// Upload attachment for a specific vehicle part
app.post(
  "/api/vehicle-parts/:id/attachments",
  requireAuth,
  upload.single("image"),   // <-- reuse EXACT SAME multer config
  async (req, res) => {
    try {
      const vehiclePartId = req.params.id;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      // Insert attachment record
      await db.query(
        `INSERT INTO vehicle_part_attachments (vehicle_part_id, url)
         VALUES (?, ?)`,
        [vehiclePartId, fileUrl]
      );

      res.json({ success: true, url: fileUrl });
    } catch (err) {
      console.error("Attachment upload error:", err);
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  }
);

app.post(
  "/api/vehicles/:vehicleId/registration/:registrationId/attachments",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    const { registrationId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Image upload failed — no file received" });
    }

    // Local multer uses req.file.path
    const fileUrl = req.file.path;

    try {
      const [result] = await db.execute(
        `INSERT INTO registration_attachments (registration_id, url)
         VALUES (?, ?)`,
        [registrationId, fileUrl]
      );

      res.json({
        success: true,
        id: result.insertId,
        url: fileUrl,
      });
    } catch (err) {
      console.error("Error saving registration attachment:", err);
      res.status(500).json({ error: "DB insert failed" });
    }
  }
);


// POST /api/vehicles/:vehicleId/registration
app.post("/api/vehicles/:vehicleId/registration", requireAuth, async (req, res) => {
  const { vehicleId } = req.params;
  const { start_date, expiration_date, state, notes } = req.body;

  if (!start_date) {
    return res.status(400).json({ error: "start_date is required" });
  }

  // Auto-calc expiration if not provided
  let expDate = expiration_date;
  if (!expDate) {
    const d = new Date(start_date);
    d.setFullYear(d.getFullYear() + 1);
    expDate = d.toISOString().split("T")[0];
  }
  const finalState = state || "UT"; // default if missing

  try {
    await db.execute(
      `
      INSERT INTO vehicle_registrations (vehicle_id, registration_date, expiration_date, state, notes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [vehicleId, start_date, expDate, finalState, notes || null]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("POST registration insert error:", err);
    res.status(500).json({ error: "DB insert failed" });
  }
});

// GET latest registration for a vehicle
app.get("/api/vehicles/:id/registration/latest", requireAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const [[registration]] = await db.query(
      `
      SELECT 
        registration_id,
        vehicle_id,
        registration_date,
        expiration_date,
        plate_number,
        state,
        renewal_cost,
        notes
      FROM vehicle_registrations
      WHERE vehicle_id = ?
      ORDER BY expiration_date DESC, registration_id DESC
      LIMIT 1
      `,
      [vehicleId]
    );

    res.json(registration || null);

  } catch (err) {
    console.error("Error fetching latest registration:", err);
    res.status(500).json({ error: "Failed to load registration" });
  }
});

// GET /api/vehicles/:vehicleId/loan
app.get("/api/vehicles/:vehicleId/loan", requireAuth, async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM vehicle_loans
       WHERE vehicle_id = ?
       ORDER BY loan_id DESC
       LIMIT 1`,
      [vehicleId]
    );

    if (rows.length === 0) {
      return res.json({ loan: null });
    }

    const loan = rows[0];

    // Compute progress
    const start = new Date(loan.start_date);
    const now = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + loan.term_months);

    const totalMonths = loan.term_months;
    const elapsedMonths =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    const progress =
      loan.paid_off
        ? 100
        : Math.max(0, Math.min(100, (elapsedMonths / totalMonths) * 100));

    res.json({
      loan,
      progress,
      isPaidOff: loan.paid_off === 1,
      end_date: end.toISOString().split("T")[0]
    });
  } catch (err) {
    console.error("GET loan failed:", err);
    res.status(500).json({ error: "Failed to load loan info" });
  }
});

app.post("/api/vehicles/:vehicleId/loan", requireAuth, async (req, res) => {
  const { vehicleId } = req.params;
  const { lender, start_date, term_months, interest_rate, notes } = req.body;

  if (!start_date || !term_months || !interest_rate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.execute(
      `INSERT INTO vehicle_loans 
       (vehicle_id, lender, start_date, term_months, interest_rate, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicleId, lender, start_date, term_months, interest_rate, notes]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Insert loan failed:", err);
    res.status(500).json({ error: "Failed to insert loan" });
  }
});

// GET /api/vehicles/:id/odometer/latest
app.get("/api/vehicles/:id/odometer/latest", requireAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const [[row]] = await db.query(
      `
      SELECT id, vehicle_id, date, mileage
      FROM vehicle_odometer
      WHERE vehicle_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 1
      `,
      [vehicleId]
    );

    if (!row) {
      return res.json(null); // frontend handles empty state
    }

    res.json(row);
  } catch (err) {
    console.error("GET latest odometer error:", err);
    res.status(500).json({ error: "Failed to load latest odometer reading" });
  }
});


// GET /api/vehicles/:id/odometer
app.get("/api/vehicles/:id/odometer", requireAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const [rows] = await db.query(
      `
      SELECT id, vehicle_id, date, mileage
      FROM vehicle_odometer
      WHERE vehicle_id = ?
      ORDER BY date DESC, id DESC
      `,
      [vehicleId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET odometer error:", err);
    res.status(500).json({ error: "Failed to load odometer entries" });
  }
});


app.get("/api/vehicles/:id/upcoming", requireAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // ------------------------------------------------------------
    // 1. GET CURRENT ODOMETER
    // ------------------------------------------------------------
    const [[odo]] = await db.query(
      `
      SELECT mileage, date
      FROM vehicle_odometer
      WHERE vehicle_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 1
      `,
      [vehicleId]
    );

    const currentMileage = odo?.mileage || 0;
    const today = new Date();

    const dbSeverityPriority = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    // ------------------------------------------------------------
    // 2. GET LATEST installation per part (dedupe)
    // ------------------------------------------------------------
    // Returns only the MOST RECENT vehicle_parts row for each part_id
    const [parts] = await db.query(
      `
      SELECT vp.part_id,
             vp.installation_date,
             vp.installation_mileage,
             p.name,
             vp.estimated_life_mileage,
             vp.estimated_life_months,
             p.severity
      FROM vehicle_parts vp
      JOIN parts p ON p.part_id = vp.part_id
      WHERE vp.vehicle_id = ?
      ORDER BY vp.installation_date DESC, vp.id DESC
      `,
      [vehicleId]
    );

    // Deduplicate by part_id → most recent only
    const latestMap = new Map();
    for (const item of parts) {
      if (!latestMap.has(item.part_id)) {
        latestMap.set(item.part_id, item);
      }
    }

    const latestParts = [...latestMap.values()];

    // ------------------------------------------------------------
    // 3. Compute upcoming status
    // ------------------------------------------------------------
    const upcoming = [];

    for (const part of latestParts) {
      const {
        part_id,
        name,
        estimated_life_mileage,
        estimated_life_months,
        installation_date,
        installation_mileage
      } = part;

      let dueMiles = null;
      let milesToGo = null;

      // --- Mileage-based ---
      if (estimated_life_mileage && installation_mileage != null) {
        dueMiles = installation_mileage + estimated_life_mileage;
        milesToGo = dueMiles - currentMileage;  // can be negative
      }

      // --- Time-based ---
      let dueDate = null;
      let monthsToGo = null;

      if (estimated_life_months && installation_date) {
        const dt = new Date(installation_date);
        dt.setMonth(dt.getMonth() + estimated_life_months);
        dueDate = dt;

        // Months difference
        const now = new Date();
        monthsToGo =
          (dueDate.getFullYear() - now.getFullYear()) * 12 +
          (dueDate.getMonth() - now.getMonth());
      }

      // ------------------------------------------------------------
      // 4. Determine SEVERITY
      // ------------------------------------------------------------

      let severity = "green";
      const priority = dbSeverityPriority[part.severity] ?? 1;
      const fixed_severity = part.severity;

      const mMiles = milesToGo ?? Infinity;
      const mMonths = monthsToGo ?? Infinity;

      const isPastDue = mMiles < 0 || mMonths < 0;
      const highRisk = mMiles <= 3000 || mMonths <= 3;
      const mediumRisk = mMiles <= 5000 || mMonths <= 6;

      if (isPastDue) {
        severity = "red";
      } else if (highRisk) {
        severity = "orange";
      } else if (mediumRisk) {
        severity = "yellow";
      } else {
        severity = "green";
      }

      if (dueMiles === null && dueDate === null) {
        continue;
      }

      upcoming.push({
        part_id,
        name,
        due_miles: dueMiles,
        due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
        miles_to_go: milesToGo,
        months_to_go: monthsToGo,
        severity,
        priority,
        fixed_severity,
      });
    }

    // ------------------------------------------------------------
    // 5. SORT by severity priority DESC, then urgency
    //     (More overdue = higher priority)
    // ------------------------------------------------------------
    upcoming.sort((a, b) => {
      // Sort by priority (red > orange > yellow > green)
      if (b.priority !== a.priority) return b.priority - a.priority;

      // Then by smallest miles_to_go (negative = most urgent)
      const aMiles = a.miles_to_go ?? Infinity;
      const bMiles = b.miles_to_go ?? Infinity;
      return aMiles - bMiles;
    });

    res.json(upcoming);

  } catch (err) {
    console.error("GET upcoming fixes error:", err);
    res.status(500).json({ error: "Failed to load upcoming fixes" });
  }
});


// ===== GET VEHICLE HISTORY =====
app.get("/api/vehicles/:id/history", requireAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const [rows] = await db.query(
      `
      SELECT 
        vp.id,
        p.name,
        vp.installation_date,
        vp.installation_mileage,
        vp.estimated_life_mileage,
        vp.estimated_life_months,
        vp.warranty_mileage,
        vp.warranty_months,
        vp.cost,
        vp.shop_location,
        vp.notes,
        vp.type
      FROM vehicle_parts vp
      JOIN parts p ON p.part_id = vp.part_id
      WHERE vp.vehicle_id = ?
      ORDER BY vp.installation_date DESC, vp.id DESC
      `,
      [vehicleId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET history error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// ===== GET all parts =====
app.get("/api/parts", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         part_id, category, name, description, notes,
         expected_lifespan_miles, expected_lifespan_months, severity
       FROM parts
       ORDER BY category, name`
    );

    res.json(rows);
  } catch (err) {
    console.error("GET parts error:", err);
    res.status(500).json({ error: "Failed to fetch parts" });
  }
});


app.post("/api/vehicles/:id/add-parts", requireAuth, async (req, res) => {
  const vehicleId = req.params.id;
  const { service_date, mileage, shop, parts } = req.body;

  try {
    for (const p of parts) {
      await db.query(
        `INSERT INTO vehicle_parts 
        (vehicle_id, part_id, installation_date, installation_mileage, shop_location, cost, notes,
         warranty_mileage, warranty_months, estimated_life_mileage, estimated_life_months)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vehicleId,
          p.part_id,
          service_date,
          mileage,
          shop,
          p.cost || null,
          p.notes || "",
          p.warranty_mileage || null,
          p.warranty_months || null,
          p.estimated_life_mileage || null,
          p.estimated_life_months || null,
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error adding parts:", err);
    res.status(500).json({ error: "Failed to add parts" });
  }
});

// ===================================================================

// ====== START SERVER ======
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running on port ${port}`));

