const express = require("express");
const courseRouter = express.Router();
const db = require("../config/db");

// ROUTE: /api/courses

// GET Course list with assigned teacher info
courseRouter.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT course_surrogate_id, course_id, course_code, course_name, hours_week, course_year, course_college, semester, first_name, last_name, room_name, created_by
      FROM courses c
      LEFT JOIN teachers t 
      ON c.assigned_teacher = t.teacher_id
      LEFT JOIN rooms r
      ON c.assigned_room = r.room_id
    `;

    const [rows] = await db.execute(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Assign teacher and room to a course
courseRouter.put("/assign/:course_id", async (req, res) => {
  try {
    const { teacher_id, room_id } = req.body;
    const { course_id } = req.params;

    const [result] = await db.execute(
      `UPDATE courses SET assigned_teacher = ?, assigned_room = ? WHERE course_id = ?`,
      [teacher_id, room_id, course_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: `Course not found` });

    return res
      .status(200)
      .json({ message: `Teacher & room assigned successfully` });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Get 5 recently added courses
courseRouter.get("/recent", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM courses ORDER BY course_id DESC LIMIT 5"
    );
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Get courses by department
courseRouter.get("/:department", async (req, res) => {
  try {
    const { department } = req.params;

    // SELECT course_surrogate_id, course_id, course_code, course_name, hours_week, course_year, course_college, semester, first_name, last_name, room_name, created_by, is_plotted
    const sql = `
      SELECT *
      FROM courses c
      LEFT JOIN teachers t ON c.assigned_teacher = t.teacher_id
      LEFT JOIN rooms r ON c.assigned_room = r.room_id
      WHERE course_college = ?
    `;

    const [rows] = await db.execute(sql, [department]);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Get courses with year & semester filter
courseRouter.get("/:department/filter", async (req, res) => {
  try {
    const { department } = req.params;
    const { year, sem } = req.query;

    const sql = `
      SELECT c.course_id, c.course_code, c.course_name, c.hours_week, c.is_plotted, c.created_by, 
             c.assigned_teacher, c.assigned_room, t.first_name, t.last_name, r.room_name 
      FROM courses c 
      LEFT JOIN teachers t ON c.assigned_teacher = t.teacher_id 
      LEFT JOIN rooms r ON c.assigned_room = r.room_id 
      WHERE c.course_college = ? AND c.course_year = ? AND c.semester = ?
    `;

    const [rows] = await db.execute(sql, [department, year, sem]);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Get courses by department, year, sem
courseRouter.get("/:department/year/:year/sem/:sem", async (req, res) => {
  try {
    const { department, year, sem } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM courses LEFT JOIN teachers ON courses.assigned_teacher = teachers.teacher_id WHERE course_college = ? AND course_year = ? AND semester = ?",
      [department, year, sem]
    );

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Add a course
courseRouter.post("/", async (req, res) => {
  try {
    const {
      course_id,
      course_code,
      course_name,
      hours_week,
      course_year,
      course_college,
      semester,
      assigned_teacher,
      created_by,
    } = req.body;

    if (hours_week < 1 || hours_week > 8) {
      return res
        .status(400)
        .json({ message: "hours_week must be between 1 and 8" });
    }

    const [result] = await db.execute(
      `INSERT INTO courses (course_id, course_code, course_name, hours_week, course_year, course_college, semester, assigned_teacher, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        course_code,
        course_name,
        hours_week,
        course_year,
        course_college,
        semester,
        assigned_teacher,
        created_by,
      ]
    );

    return res.status(201).json({
      message: `Course created`,
      courseId: result.insertId,
    });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Update a course
// courseRouter.put("/:course_surrogate_id", async (req, res) => {
courseRouter.put("/:course_id", async (req, res) => {
  try {
    const { course_id } = req.params;
    // const { course_surrogate_id } = req.params;
    const {
      // course_id,
      course_code,
      course_name,
      hours_week,
      course_year,
      course_college,
      semester,
    } = req.body;

    // console.log(course_id);
    // console.log(course_code);
    // console.log(course_name);
    // console.log(hours_week);
    // console.log(course_year);
    // console.log(course_college);
    // console.log(semester);

    const [result] = await db.execute(
      `UPDATE courses SET course_code = ?, course_name = ?, hours_week = ? WHERE course_id = ? AND course_year = ? AND semester = ? AND course_college = ?`,
      [
        course_code,
        course_name,
        hours_week,
        course_id,
        course_year,
        semester,
        course_college,
      ]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Course not found or data unchanged" });

    return res.status(200).json({
      message: `Course updated successfully`,
    });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

// Delete course
courseRouter.delete("/:course_id", async (req, res) => {
  try {
    const { course_id } = req.params;

    const [result] = await db.execute(
      `DELETE FROM courses WHERE course_id = ?`,
      [course_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Course not found" });

    return res
      .status(200)
      .json({ message: `Course deleted successfully`, id: course_id });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
});

module.exports = courseRouter;
