const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // mysql2/promise connection pool

const changePasswordRouter = express.Router();
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET;

changePasswordRouter.post("/", async (req, res) => {
  try {
    const { newPassword } = req.body;
    console.log(newPassword);

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long.",
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const userId = decoded.id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    const sql = `
      UPDATE profiles
      SET password = ?, change_password = 'no'
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [hashedPassword, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = changePasswordRouter;
