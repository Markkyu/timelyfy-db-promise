const express = require("express");
const pool = require("../config/db"); // mysql2/promise pool
const meRouter = express.Router();
const { verifyRole } = require("../middleware/authMiddleware");

meRouter.get("/", verifyRole(["*"]), async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await pool.query(
      `SELECT id, username, role, email, full_name, change_password FROM profiles WHERE id = ?`,
      [userId]
    );

    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });

    return res.json({ user: results[0] });
  } catch (err) {
    console.error("DB Error (me route):", err);
    return res.status(500).json({ message: "DB Error" });
  }
});

module.exports = meRouter;
