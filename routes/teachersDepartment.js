const express = require("express");
const teacherDepartmentRouter = express.Router();
const pool = require("../config/db");

// ROUTE: /api/teachers/departments/:id

// GET Teachers in certain department
teacherDepartmentRouter.get("/:department", async (req, res) => {
  const { department } = req.params;

  try {
    // Check if department exists
    const [deptResults] = await pool.query(
      "SELECT college_id FROM colleges WHERE college_id = ?",
      [department]
    );

    if (deptResults.length === 0) {
      return res.status(404).json({
        message: `Department with ID ${department} does not exist`,
      });
    }

    // Department exists → get teachers
    const [rows] = await pool.query(
      `SELECT * 
       FROM teachers 
       JOIN colleges ON teachers.department = colleges.college_id 
       WHERE teachers.department = ?`,
      [department]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: `Server Error: ${error.message}` });
  }
});

// ADD Teacher in certain department
teacherDepartmentRouter.post("/:department", async (req, res) => {
  const { department } = req.params;
  const { first_name, last_name } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO teachers (first_name, last_name, department) VALUES (?, ?, ?)`,
      [first_name, last_name, department]
    );

    res.status(201).json({
      message: `Teacher created`,
      teacherId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: `Database error: ${err.message}` });
  }
});

// UPDATE Teacher in certain department
teacherDepartmentRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE teachers SET first_name = ?, last_name = ? WHERE teacher_id = ?",
      [first_name, last_name, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Teacher not found" });

    res.status(200).json({ message: "Teacher updated" });
  } catch (err) {
    res.status(500).json({ message: `Database error: ${err.message}` });
  }
});

// DELETE Teacher
teacherDepartmentRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM teachers WHERE teacher_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Teacher not found" });

    res.status(200).json({ message: "Teacher deleted" });
  } catch (err) {
    res.status(500).json({ message: `Database error: ${err.message}` });
  }
});

module.exports = teacherDepartmentRouter;
