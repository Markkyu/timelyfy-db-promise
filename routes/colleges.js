const express = require("express");
const collegesRouter = express.Router();
const db = require("../config/db");
const { verifyRole } = require("../middleware/authMiddleware");

// ROUTE: /api/colleges

// GET Colleges (filtered by role)
collegesRouter.get("/", verifyRole(["*"]), async (req, res) => {
  try {
    const { role, id } = req.user;

    let sql = "";
    let params = [];

    if (role === "user") {
      sql = `
        SELECT *  
        FROM user_programs up
        INNER JOIN colleges c
          ON c.college_id = up.program_id 
        WHERE up.user_id = ?
        ORDER BY c.college_name ASC
      `;
      params = [id];
    } else {
      sql = "SELECT * FROM colleges ORDER BY college_name ASC";
    }

    const [rows] = await db.execute(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Error fetching colleges: ${err.message}` });
  }
});

// GET specific college
collegesRouter.get("/:college_id", verifyRole(["*"]), async (req, res) => {
  try {
    const { college_id } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM colleges WHERE college_id = ?",
      [college_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "No college found with this Id" });

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Create a college
collegesRouter.post(
  "/",
  verifyRole(["master_scheduler", "admin"]),
  async (req, res) => {
    try {
      const { college_code, college_name, college_major } = req.body;

      const [result] = await db.execute(
        "INSERT INTO colleges (college_code, college_name, college_major) VALUES (?, ?, ?)",
        [college_code, college_name, college_major]
      );

      return res.status(201).json({
        message: "College successfully inserted",
        collegeId: result.insertId,
      });
    } catch (err) {
      return res.status(500).json({ message: `Error: ${err.message}` });
    }
  }
);

// Update a college
collegesRouter.put("/:college_id", async (req, res) => {
  try {
    const { college_id } = req.params;
    const { college_code, college_name, college_major } = req.body;

    const [result] = await db.execute(
      "UPDATE colleges SET college_code = ?, college_name = ?, college_major = ? WHERE college_id = ?",
      [college_code, college_name, college_major, college_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "College not found" });

    return res.status(200).json({
      message: `College with Id: ${college_id} updated successfully`,
    });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// DELETE College
collegesRouter.delete(
  "/:college_id",
  verifyRole(["admin", "master_scheduler"]),
  async (req, res) => {
    try {
      const { college_id } = req.params;

      const [result] = await db.execute(
        "DELETE FROM colleges WHERE college_id = ?",
        [college_id]
      );

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "College not found" });

      return res.status(200).json({
        message: `College Id: ${college_id} deleted successfully`,
      });
    } catch (err) {
      return res.status(500).json({ message: `Error: ${err.message}` });
    }
  }
);

module.exports = collegesRouter;
