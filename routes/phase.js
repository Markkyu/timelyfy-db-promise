const express = require("express");
const phaseRouter = express.Router();
const pool = require("../config/db"); // mysql2/promise pool
const { verifyRole } = require("../middleware/authMiddleware");

// GET Phase Control (always phase_id = 1)
phaseRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM phase_control WHERE phase_id = 1`
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching phase:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// UPDATE Phase Control
phaseRouter.put(
  "/:phase_id",
  verifyRole(["admin", "master_scheduler"]),
  async (req, res) => {
    const { phase_id } = req.params;
    const { phase_year, phase_sem, phase_supervisor } = req.body;

    try {
      const [result] = await pool.query(
        `UPDATE phase_control 
       SET phase_year = ?, phase_sem = ?, phase_supervisor = ? 
       WHERE phase_id = ?`,
        [phase_year, phase_sem, phase_supervisor, phase_id]
      );

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Phase_id not found" });

      return res.status(200).json({
        message: `Phase Updated → Supervisor: ${phase_supervisor}, Year: ${phase_year}, Sem: ${phase_sem}`,
      });
    } catch (err) {
      console.error("Error updating phase:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

module.exports = phaseRouter;
