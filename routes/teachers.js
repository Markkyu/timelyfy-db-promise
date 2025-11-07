const express = require("express");
const teacherRouter = express.Router();
const pool = require("../config/db");

// GET Teachers
teacherRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM teachers ORDER BY first_name"
    );

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// GET Teacher schedules by Id
teacherRouter.get("/schedule/:teacherId", async (req, res) => {
  const { teacherId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM teacher_schedules WHERE teacher_id = ? ORDER BY teacher_time_day, teacher_slot_time",
      [teacherId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: `No teacher schedule found` });

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// SEARCH Teacher by name
teacherRouter.get("/:teacher_id", async (req, res) => {
  const { teacher_id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: `Teacher with id: ${teacher_id} not found` });

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// CREATE Teacher (No department)
teacherRouter.post("/", async (req, res) => {
  const { first_name, last_name, teacher_availability } = req.body;

  const firstNameClean = first_name?.trim();
  const lastNameClean = last_name?.trim();

  if (!firstNameClean || !lastNameClean) {
    return res.status(400).json({ message: `Fields cannot be empty` });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO teachers (first_name, last_name, teacher_availability) VALUES (?, ?, ?)`,
      [firstNameClean, lastNameClean, teacher_availability]
    );

    res.status(201).json({
      message: `Teacher created`,
      teacherId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// UPDATE Teacher
teacherRouter.put("/:teacher_id", async (req, res) => {
  const { teacher_id } = req.params;
  const { first_name, last_name, department, teacher_availability } = req.body;

  const firstNameClean = first_name?.trim();
  const lastNameClean = last_name?.trim();

  if (!firstNameClean || !lastNameClean || !department) {
    return res.status(400).json({ message: `Fields cannot be empty` });
  }

  try {
    const [result] = await pool.query(
      `UPDATE teachers SET first_name = ?, last_name = ?, department = ?, teacher_availability = ? WHERE teacher_id = ?`,
      [
        firstNameClean,
        lastNameClean,
        department,
        teacher_availability,
        teacher_id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: `Teacher not found` });

    res.status(200).json({ message: `Teacher updated` });
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// DELETE Teacher
teacherRouter.delete("/:teacher_id", async (req, res) => {
  const { teacher_id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: `Teacher not found` });

    res.status(200).json({ message: `Teacher deleted` });
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

module.exports = teacherRouter;
