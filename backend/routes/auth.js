import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const ACCESS_PIN = process.env.ACCESS_PIN || "1234";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const TOKEN_EXPIRES = "24h";

// POST /api/auth/check-pin
router.post("/check-pin", (req, res) => {
  console.log("AUTH ROUTE BODY:", req.body);   // <--- ADD THIS

  const pin = req.body.pin || req.body.code;   // <--- FIX: accept either

  if (!pin) {
    return res.status(400).json({ error: "PIN required" });
  }

  if (pin.toString() !== ACCESS_PIN) {
    return res.status(401).json({ error: "Invalid PIN" });
  }

  const token = jwt.sign({ auth: true }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES,
  });

  return res.json({ success: true, token });
});

export default router;

