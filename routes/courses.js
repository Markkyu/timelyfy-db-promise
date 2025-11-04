// const express = require("express");
// const courseRouter = express.Router();
// const connection = require("../config/db");

// // Common HTTP Requests
// // 200 - OK
// // 201 - Created
// // 500 - Internal Server Error

// // ROUTE: /api/courses

// // GET Course along with the assgined Teacher info
// courseRouter.get("/", (req, res) => {
//   const sql = `
//     SELECT course_id, course_code, course_name, hours_week, course_year, course_college, semester, first_name, last_name, room_name, created_by
//     FROM courses c
//     LEFT JOIN teachers t
//     ON c.assigned_teacher = t.teacher_id
//     LEFT JOIN rooms r
//     ON c.assigned_room = r.room_id
//   `;

//   connection.query(sql, (err, courseRows) => {
//     if (err)
//       return res
//         .status(500)
//         .json({ message: `An error has occurred: ${err.sqlMessage}` });

//     res.status(200).json(courseRows);
//   });
// });

// // Assign teacher in a subject
// courseRouter.put("/assign/:course_id", (req, res) => {
//   const { teacher_id, room_id } = req.body;
//   const { course_id } = req.params;

//   connection.query(
//     `UPDATE courses SET assigned_teacher = ?, assigned_room = ? WHERE course_id = ?`,
//     [teacher_id, room_id, course_id],
//     (err, result) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: `An error has occured ${err.sqlMessage}` });

//       if (result.affectedRows === 0)
//         return res
//           .status(404)
//           .json({ message: `Nothing found with subject Id ${course_id}` });

//       res
//         .status(200)
//         .json({ message: `A teacher was assigned to this course` });
//     }
//   );
// });

// // GET the 5 recently added courses
// courseRouter.get("/recent", (req, res) => {
//   connection.query(
//     "SELECT * FROM courses ORDER BY course_id DESC LIMIT 5",
//     (err, rows) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: `An error has occurred: ${err.sqlMessage}` });

//       res.status(200).json(rows);
//     }
//   );
// });

// // GET Course with assigned teacher info where department Id is id
// courseRouter.get("/:department", (req, res) => {
//   const { department } = req.params;

//   const sql = `
//     SELECT course_id, course_code, course_name, hours_week, course_year, course_college, semester, first_name, last_name, room_name, created_by
//     FROM courses c
//     LEFT JOIN teachers t
//     ON c.assigned_teacher = t.teacher_id
//     LEFT JOIN rooms r
//     ON c.assigned_room = r.room_id
//     WHERE course_college = ?
//   `;

//   connection.query(sql, [department], (err, result) => {
//     if (err)
//       return res
//         .status(500)
//         .json({ message: `An error has occurred: ${err.sqlMessage}` });

//     if (result.affectedRows === 0)
//       return res.status(404).json({ message: `Cannot find college course` });

//     res.status(200).json(result);
//   });
// });

// // GET SPECIFIC COURSE FROM YEAR AND SEM
// courseRouter.get("/:department/filter", (req, res) => {
//   const { department } = req.params;
//   const { year, sem } = req.query;

//   const sql = `
//     SELECT c.course_id, c.course_code, c.course_name, c.hours_week, c.is_plotted, c.created_by, c.assigned_teacher, c.assigned_room, t.first_name, t.last_name, r.room_name
//     FROM courses c
//     LEFT JOIN teachers t
//     ON c.assigned_teacher = t.teacher_id
//     LEFT JOIN rooms r
//     ON c.assigned_room = r.room_id
//     WHERE c.course_college = ? AND c.course_year = ? AND c.semester = ?
//   `;

//   connection.query(sql, [department, year, sem], (err, result) => {
//     if (err)
//       return res
//         .status(500)
//         .json({ message: `An error has occurred: ${err.sqlMessage}` });

//     if (result.affectedRows === 0)
//       return res.status(404).json({ message: `Cannot find college course` });

//     res.status(200).json(result);
//   });
// });

// // GET A SPECIFIC Course with YEAR and SEM
// courseRouter.get("/:department/year/:year/sem/:sem", (req, res) => {
//   const { department, year, sem } = req.params;

//   connection.query(
//     "SELECT * FROM courses LEFT JOIN teachers ON courses.assigned_teacher = teachers.teacher_id WHERE course_college = ? AND course_year = ? AND semester = ?",
//     [department, year, sem],
//     (err, rows) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: `An error has occurred: ${err.sqlMessage}` });

//       if (rows.affectedRows === 0)
//         return res
//           .status(404)
//           .json({ message: `Cannot find college subjects` });

//       res.status(200).json(rows);
//     }
//   );
// });

// // Add a subject in a college program, year, and sem
// courseRouter.post("/", (req, res) => {
//   const {
//     course_code,
//     course_name,
//     hours_week,
//     course_year,
//     course_college,
//     semester,
//     assigned_teacher,
//     created_by,
//   } = req.body;

//   if (hours_week < 1 || hours_week > 6) {
//     return res
//       .status(400)
//       .json({ message: "hours_week must be between 1 and 6" });
//   }

//   connection.query(
//     `INSERT INTO courses (course_code, course_name, hours_week, course_year, course_college, semester, assigned_teacher, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       course_code,
//       course_name,
//       hours_week,
//       course_year,
//       course_college,
//       semester,
//       assigned_teacher,
//       created_by,
//     ],
//     (err, result) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: `An error has occurred: ${err.sqlMessage}` });

//       res.status(201).json({
//         message: `Subject successfully added with Id: ${result.insertId}`,
//       });
//     }
//   );
// });

// // UPDATE Course
// courseRouter.put("/:course_id", (req, res) => {
//   const { course_id } = req.params;
//   const {
//     course_code,
//     course_name,
//     hours_week,
//     course_year,
//     course_college,
//     semester,
//     assigned_teacher,
//   } = req.body;

//   connection.query(
//     `UPDATE courses SET course_code = ?, course_name = ?, hours_week = ?, assigned_teacher = ? WHERE course_id = ? AND course_year = ? AND semester = ? AND course_college = ?`,
//     [
//       course_code,
//       course_name,
//       hours_week,
//       assigned_teacher,
//       course_id,
//       course_year,
//       semester,
//       course_college,
//     ],

//     (err, result) => {
//       if (err)
//         return res.status(500).json({
//           message: `An error has occurred: ${err.sqlMessage}`,
//         });

//       if (result.affectedRows === 0)
//         return res
//           .status(404)
//           .json({ message: `No Subject found with Id: ${course_id}` });

//       res.status(200).json({
//         message: `Subject Id: ${course_id} has been successfully updated`,
//       });
//     }
//   );
// });

// // DELETE Course
// courseRouter.delete("/:course_id", (req, res) => {
//   const { course_id } = req.params;

//   connection.query(
//     `DELETE FROM courses WHERE course_id = ?`,
//     [course_id],
//     (err, result) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: `An error has occurred: ${err.sqlMessage}` });

//       if (result.affectedRows === 0)
//         return res
//           .status(404)
//           .json({ message: `Cannot find subject of Id: ${course_id}` });

//       res
//         .status(200)
//         .json({ message: `Successfully deleted subject Id ${course_id}` });
//     }
//   );
// });

// module.exports = courseRouter;

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

    const sql = `
      SELECT course_surrogate_id, course_id, course_code, course_name, hours_week, course_year, course_college, semester, first_name, last_name, room_name, created_by, is_plotted
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

    console.log(course_id);
    console.log(course_code);
    console.log(course_name);
    console.log(hours_week);
    console.log(course_college);
    console.log(semester);
    console.log(assigned_teacher);
    console.log(created_by);

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
courseRouter.put("/:course_surrogate_id", async (req, res) => {
  try {
    const { course_surrogate_id } = req.params;
    const {
      course_id,
      course_code,
      course_name,
      hours_week,
      course_year,
      course_college,
      semester,
      assigned_teacher = "0",
    } = req.body;

    console.log(course_id);
    console.log(course_code);
    console.log(course_name);
    console.log(hours_week);
    console.log(course_year);
    console.log(course_college);
    console.log(semester);
    console.log(assigned_teacher);

    const [result] = await db.execute(
      `UPDATE courses SET course_id = ?, course_code = ?, course_name = ?, hours_week = ?, assigned_teacher = ? WHERE course_surrogate_id = ? AND course_year = ? AND semester = ? AND course_college = ?`,
      [
        course_id,
        course_code,
        course_name,
        hours_week,
        assigned_teacher,
        course_surrogate_id,
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
