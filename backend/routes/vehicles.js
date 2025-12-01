import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/* ===== GET ALL VEHICLES ===== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vehicles ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("DB ERROR (GET /vehicles):", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ===== ADD VEHICLE ===== */
router.post("/", async (req, res) => {
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
    } = req.body;

    const sql = `
      INSERT INTO vehicles 
      (make, model, year, vin, plate, purchase_date, purchase_mileage, picture_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      make,
      model,
      year,
      vin,
      plate,
      purchase_date,
      purchase_mileage,
      picture_url,
    ];

    const [result] = await pool.query(sql, params);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("DB ERROR (POST /vehicles):", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
