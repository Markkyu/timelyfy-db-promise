const express = require("express");
const scheduleRouter = express.Router();
const pool = require("../config/db");
const axios = require("axios");
const { schedulerLimiter } = require("../middleware/apiLimiter");

// ROUTE: /api/schedules

// GET schedule from a specific class group, year, sem
scheduleRouter.get("/:college/filter", async (req, res) => {
  const { college } = req.params;
  const { year, sem } = req.query;

  const sql = `
    SELECT ts.slot_course, ts.slot_day, ts.slot_time, c.course_name
    FROM teacher_schedules ts
    INNER JOIN courses c ON ts.slot_course = c.course_id 
    WHERE c.course_college = ? 
      AND c.course_year = ? 
      AND c.semester = ?;
  `;

  try {
    const [rows] = await pool.query(sql, [college, year, sem]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
});

scheduleRouter.get(
  "/teacher-schedule-conflict/:teacher_id",
  async (req, res) => {
    const { teacher_id } = req.params;
    const { year, sem, college } = req.query;

    const sql = `
    SELECT ts.slot_course, ts.slot_day, ts.slot_time, c.course_name
    FROM teacher_schedules ts
    INNER JOIN courses c ON ts.slot_course = c.course_id 
    WHERE ts.teacher_id = ?
    AND (c.course_college != 1 OR c.course_year != 1 OR c.semester != 1);
  `;

    try {
      const [rows] = await pool.query(sql, [college, year, sem]);
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: `Error: ${err.message}` });
    }
  }
);

// GET schedule of the class group
scheduleRouter.get("/college/:classId", async (req, res) => {
  const { classId } = req.params;

  const sql = `
    SELECT *
    FROM class_schedules cs
    LEFT JOIN courses c
    ON c.course_id = cs.slot_course
    WHERE cs.slot_course NOT IN ("0", "2")
    AND cs.class_id = ?
  `;

  try {
    const [rows] = await pool.query(sql, [classId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

// GET schedule of the teacher
scheduleRouter.get("/teacher/:teacher_id", async (req, res) => {
  const { teacher_id } = req.params;

  const sql = `
    SELECT *
    FROM teacher_schedules ts
    LEFT JOIN teachers t
    ON t.teacher_id = ts.teacher_id
    LEFT JOIN courses c
    ON c.course_id = ts.slot_course
    LEFT JOIN rooms r
    ON r.room_id = c.assigned_room
    WHERE ts.slot_course NOT IN ("0","2") 
    AND ts.teacher_id = ?
  `;

  try {
    const [rows] = await pool.query(sql, [teacher_id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

// GET schedule of the room
scheduleRouter.get("/room/:room_id", async (req, res) => {
  const { room_id } = req.params;

  const sql = `
    SELECT * 
    FROM room_schedules rs
    INNER JOIN rooms r
    ON r.room_id = rs.room_id
    INNER JOIN courses c
    ON c.course_id = rs.slot_course
    WHERE rs.slot_course NOT IN ("0","2")
    AND rs.room_id = ?
  `;

  try {
    const [rows] = await pool.query(sql, [room_id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

// Plot schedules
scheduleRouter.post("/plot", async (req, res) => {
  const schedules = req.body;

  // console.log(schedules);

  if (!Array.isArray(schedules) || schedules.length === 0)
    return res
      .status(400)
      .json({ message: "Newly plotted schedules cannot be empty" });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const classSQL = `
      UPDATE class_schedules
      SET slot_course = ?
      WHERE class_id = ? AND slot_day = ? AND slot_time = ?
    `;

    const teacherSQL = `
      UPDATE teacher_schedules
      SET slot_course = ?
      WHERE teacher_id = ? AND slot_day = ? AND slot_time = ?
    `;

    const roomSQL = `
      UPDATE room_schedules
      SET slot_course = ?
      WHERE room_id = ? AND slot_day = ? AND slot_time = ?
    `;

    // Update class schedules
    for (const s of schedules) {
      await conn.query(classSQL, [
        s.slot_course,
        s.class_id,
        s.slot_day,
        s.slot_time,
      ]);
    }

    // Update teacher schedules
    for (const s of schedules) {
      await conn.query(teacherSQL, [
        s.slot_course,
        s.teacher_id,
        s.slot_day,
        s.slot_time,
      ]);
    }

    // Update room schedules
    for (const s of schedules) {
      await conn.query(roomSQL, [
        s.slot_course,
        s.room_id,
        s.slot_day,
        s.slot_time,
      ]);
    }

    // Update courses
    const uniqueCourses = [...new Set(schedules.map((s) => s.slot_course))];
    for (const courseId of uniqueCourses) {
      await conn.query(
        `UPDATE courses SET is_plotted = 1 WHERE course_id = ?`,
        [courseId]
      );
    }

    await conn.commit();

    res.status(201).json({
      message: "Schedules plotted successfully",
      plottedCourses: uniqueCourses,
    });
  } catch (err) {
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Failed to plot schedules", error: err.message });
  } finally {
    conn.release();
  }
});

// Unplot schedules
scheduleRouter.post("/unplot", async (req, res) => {
  const courses = req.body;
  if (!Array.isArray(courses) || courses.length === 0)
    return res
      .status(400)
      .json({ message: "Courses must be a non-empty array" });

  const courseIds = courses.map((c) => c.slot_course);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE class_schedules SET slot_course = '0' WHERE slot_course IN (?)`,
      [courseIds]
    );
    await conn.query(
      `UPDATE teacher_schedules SET slot_course = '0' WHERE slot_course IN (?)`,
      [courseIds]
    );
    await conn.query(
      `UPDATE room_schedules SET slot_course = '0' WHERE slot_course IN (?)`,
      [courseIds]
    );
    await conn.query(
      `UPDATE IGNORE courses SET is_plotted = 0 WHERE course_id IN (?)`,
      [courseIds]
    );

    await conn.commit();

    res.status(200).json({
      message: "Courses successfully unplotted",
      affectedCourses: courseIds,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to unplot", error: err.message });
  } finally {
    conn.release();
  }
});

scheduleRouter.put("/execute-scheduler", schedulerLimiter, async (req, res) => {
  const newSchedules = req.body;

  console.log(newSchedules);

  if (!Array.isArray(newSchedules) || newSchedules.length === 0)
    return res.status(400).json({ message: "Schedules cannot be empty" });

  try {
    const { data } = await axios.put(
      `${process.env.SCHEDULER_API}/update_schedules`,
      newSchedules
    );

    console.log(data);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Scheduler Error" });
  }
});

// FINAL CHECK SCHEDULE BEFORE SAVING TO DB
scheduleRouter.put("/final-check-schedule", async (req, res) => {
  const final_schedule = req.body; // array of schedules
  const final_conflict_list = [];

  const connection = await pool.getConnection();

  try {
    for (const course of final_schedule) {
      let conflict_types = []; // can contain multiple: ["room", "teacher", "class"]

      // --- Room check ---
      if (course.room_id) {
        const [roomResult] = await connection.execute(
          `SELECT * FROM room_schedules
           WHERE room_id = ? AND slot_day = ? AND slot_time = ? AND slot_course = "0"`,
          [course.room_id, course.slot_day, course.slot_time]
        );

        if (roomResult.length === 0) {
          conflict_types.push("room_conflict");
          console.log("Conflict found in ROOM:", course);
        }
      }

      // --- Teacher check ---
      if (course.teacher_id) {
        const [teacherResult] = await connection.execute(
          `SELECT * FROM teacher_schedules
           WHERE teacher_id = ? AND slot_day = ? AND slot_time = ? AND slot_course = "0"`,
          [course.teacher_id, course.slot_day, course.slot_time]
        );

        if (teacherResult.length === 0) {
          conflict_types.push("teacher_conflict");
          console.log("Conflict found in TEACHER:", course);
        }
      }

      // --- Class check ---
      if (course.class_id) {
        const [classResult] = await connection.execute(
          `SELECT * FROM class_schedules
           WHERE class_id = ? AND slot_day = ? AND slot_time = ? AND slot_course = "0"`,
          [course.class_id, course.slot_day, course.slot_time]
        );

        if (classResult.length === 0) {
          conflict_types.push("class_conflict");
          console.log("Conflict found in CLASS:", course);
        }
      }

      // If any conflicts, push details
      if (conflict_types.length > 0) {
        final_conflict_list.push({
          ...course,
          conflicts: conflict_types,
        });
      }
    }

    if (final_conflict_list.length === 0) {
      return res.status(200).json({ message: "No conflicts found!" });
    } else {
      return res.status(409).json({ conflicts: final_conflict_list });
    }
  } catch (error) {
    console.error("Error in final_check_schedule:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

// RESET ALL SCHEDULES
scheduleRouter.delete("/reset-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE class_schedules SET slot_course = 0 WHERE slot_course NOT IN (2)`
    );
    await pool.query(
      `UPDATE teacher_schedules SET slot_course = 0 WHERE slot_course NOT IN (2)`
    );
    await pool.query(
      `UPDATE room_schedules SET slot_course = 0 WHERE slot_course NOT IN (2)`
    );

    const [result] = await pool.query(`
      UPDATE courses
      SET is_plotted = 0
    `);

    res.status(200).json({
      message: `Schedules reset successfully`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = scheduleRouter;
