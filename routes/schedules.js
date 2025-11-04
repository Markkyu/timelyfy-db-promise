// const express = require("express");
// const scheduleRouter = express.Router();
// const connection = require("../config/db");

// // Common HTTP Requests
// // 200 - OK
// // 201 - Created
// // 500 - Internal Server Error

// // ROUTE: /api/schedules

// // GET schedule from a specific class group, year, sem
// scheduleRouter.get("/:college/filter", (req, res) => {
//   const { college } = req.params;
//   const { year, sem } = req.query;

//   const sql = `
//   SELECT ts.slot_course, ts.slot_day, ts.slot_time
//   FROM teacher_schedules ts
//   INNER JOIN courses c ON ts.slot_course = c.course_id
//   WHERE c.course_college = ?
//   AND c.course_year = ?
//   AND c.semester = ?
//   `;

//   connection.query(sql, [college, year, sem], (err, rows) => {
//     if (err)
//       return res
//         .status(500)
//         .json({ message: `An error occured ${err.sqlMessage}` });

//     res.status(200).json(rows);
//   });
// });

// // Plot a list of schedules
// scheduleRouter.post("/plot", (req, res) => {
//   const schedules = req.body;

//   if (!Array.isArray(schedules) || schedules.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Schedules must be a non-empty array" });
//   }

//   // Start a transaction so all updates succeed or fail together
//   connection.beginTransaction((err) => {
//     if (err) {
//       console.error("Transaction start error:", err);
//       return res.status(500).json({ message: "Failed to start transaction" });
//     }

//     const teacherSQL = `
//       UPDATE teacher_schedules
//       SET slot_course = ?
//       WHERE teacher_id = ? AND slot_day = ? AND slot_time = ?
//     `;

//     const roomSQL = `
//       UPDATE room_schedules
//       SET slot_course = ?
//       WHERE room_id = ? AND slot_day = ? AND slot_time = ?
//     `;

//     const updateTeacher = new Promise((resolve, reject) => {
//       let completed = 0;
//       schedules.forEach((sched) => {
//         connection.query(
//           teacherSQL,
//           [
//             sched.slot_course,
//             sched.teacher_id,
//             sched.slot_day,
//             sched.slot_time,
//           ],
//           (err) => {
//             if (err) return reject(err);
//             completed++;
//             if (completed === schedules.length) resolve();
//           }
//         );
//       });
//     });

//     const updateRoom = new Promise((resolve, reject) => {
//       let completed = 0;
//       schedules.forEach((sched) => {
//         connection.query(
//           roomSQL,
//           [sched.slot_course, sched.room_ID, sched.slot_day, sched.slot_time],
//           (err) => {
//             if (err) return reject(err);
//             completed++;
//             if (completed === schedules.length) resolve();
//           }
//         );
//       });
//     });

//     Promise.all([updateTeacher, updateRoom])
//       .then(() => {
//         // Collect unique courses to update once each
//         const uniqueCourses = [...new Set(schedules.map((s) => s.slot_course))];

//         let completed = 0;
//         uniqueCourses.forEach((courseId) => {
//           const sql = `UPDATE courses SET is_plotted = 1 WHERE course_id = ?`;
//           connection.query(sql, [courseId], (err) => {
//             if (err)
//               return connection.rollback(() => {
//                 console.error("Error updating courses:", err);
//                 res.status(500).json({ message: "Error updating courses" });
//               });
//             completed++;
//             if (completed === uniqueCourses.length) {
//               connection.commit((err) => {
//                 if (err) {
//                   return connection.rollback(() => {
//                     console.error("Commit error:", err);
//                     res.status(500).json({ message: "Commit failed" });
//                   });
//                 }

//                 res.status(201).json({
//                   message: `Schedules plotted successfully.`,
//                   plottedCourses: uniqueCourses,
//                 });
//               });
//             }
//           });
//         });
//       })
//       .catch((err) => {
//         connection.rollback(() => {
//           console.error("Transaction failed:", err);
//           res.status(500).json({ message: "Failed to plot schedules" });
//         });
//       });
//   });
// });

// // Unplot a list of schedules
// scheduleRouter.post("/unplot", (req, res) => {
//   const courses = req.body;

//   console.log("Received body:", req.body);

//   if (!Array.isArray(courses) || courses.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Courses must be a non-empty array" });
//   }

//   const courseIds = courses.map((c) => c.slot_course);

//   connection.beginTransaction((err) => {
//     if (err) {
//       console.error("Transaction start error:", err);
//       return res.status(500).json({ message: "Failed to start transaction" });
//     }

//     // Delete (reset) from teacher_schedules
//     const teacherSQL = `
//       UPDATE teacher_schedules
//       SET slot_course = '0'
//       WHERE slot_course IN (?)
//     `;

//     // Delete (reset) from room_schedules
//     const roomSQL = `
//       UPDATE room_schedules
//       SET slot_course = '0'
//       WHERE slot_course IN (?)
//     `;

//     // Unplot in courses
//     const courseSQL = `
//       UPDATE IGNORE courses
//       SET is_plotted = 0
//       WHERE course_id IN (?)
//     `;

//     // Update teacher_schedules
//     connection.query(teacherSQL, [courseIds], (err, teacherResult) => {
//       if (err) {
//         return connection.rollback(() => {
//           console.error("Error updating teacher_schedules:", err);
//           res.status(500).json({ message: "Error updating teacher schedules" });
//         });
//       }

//       // Update room_schedules
//       connection.query(roomSQL, [courseIds], (err, roomResult) => {
//         if (err) {
//           return connection.rollback(() => {
//             console.error("Error updating room_schedules:", err);
//             res.status(500).json({ message: "Error updating room schedules" });
//           });
//         }

//         // Update courses (set is_plotted = 0)
//         connection.query(courseSQL, [courseIds], (err, courseResult) => {
//           if (err) {
//             return connection.rollback(() => {
//               console.error("Error updating courses:", err);
//               res.status(500).json({ message: "Error updating courses" });
//             });
//           }

//           // Everything succeeded => commit changes
//           connection.commit((err) => {
//             if (err) {
//               return connection.rollback(() => {
//                 console.error("Commit error:", err);
//                 res.status(500).json({ message: "Commit failed" });
//               });
//             }

//             res.status(200).json({
//               message: "Courses successfully unplotted",
//               affectedCourses: courseIds,
//               affectedTeachers: teacherResult.affectedRows,
//               affectedRooms: roomResult.affectedRows,
//             });
//           });
//         });
//       });
//     });
//   });
// });

// scheduleRouter.put("/", (req, res) => {
//   const schedules = req.body;

//   if (!Array.isArray(schedules) || schedules.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Schedules must be a non-empty array" });
//   }

//   const sql = `
//     UPDATE teacher_schedules
//     SET slot_course = ?
//     WHERE slot_time = ?
//     AND slot_day = ?
//   `;

//   const updatePromises = schedules.map((sched) => {
//     return new Promise((resolve, reject) => {
//       connection.query(
//         sql,
//         [sched.slot_course, sched.slot_time, sched.slot_day],
//         (err, rows) => {
//           if (err) {
//             reject(`An error occurred: ${err.sqlMessage}`);
//           } else {
//             resolve(rows);
//           }
//         }
//       );
//     });
//   });

//   // Wait for all promises to resolve or catch the error if any
//   Promise.all(updatePromises)
//     .then((results) => {
//       // If all updates are successful, send a single response
//       res
//         .status(200)
//         .json({ message: "Schedules updated successfully", results });
//     })
//     .catch((error) => {
//       // If there's an error with any of the updates, send a 500 response
//       res.status(500).json({ message: error });
//     });
// });

// scheduleRouter.delete("/reset-all", (req, res) => {
//   const schedSQL = `
//     UPDATE teacher_schedules
//     SET slot_course = 0
//   `;

//   const roomSQL = `
//     UPDATE room_schedules
//     SET slot_course = 0
//   `;

//   connection.query(schedSQL, (err, results) => {
//     if (err)
//       return res
//         .status(500)
//         .json({ message: "An error occured in the backend" });

//     connection.query(roomSQL, (err, results) => {
//       if (err)
//         return res
//           .status(500)
//           .json({ message: "An error occured in the backend" });
//       res.status(200).json({
//         message: `Schedules deleted successfully, affected rows: ${results.affectedRows}`,
//       });
//     });
//   });
// });

// module.exports = scheduleRouter;

const express = require("express");
const scheduleRouter = express.Router();
const pool = require("../config/db");

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

// Run the scheduler
// scheduleRouter.post("");

// Plot schedules
scheduleRouter.post("/plot", async (req, res) => {
  const schedules = req.body;
  if (!Array.isArray(schedules) || schedules.length === 0)
    return res
      .status(400)
      .json({ message: "Newly plotted schedules cannot be empty" });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

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
        s.room_ID,
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

// Update schedules
scheduleRouter.put("/", async (req, res) => {
  const schedules = req.body;
  if (!Array.isArray(schedules) || schedules.length === 0)
    return res
      .status(400)
      .json({ message: "Newly plotted schedules cannot be empty" });

  const sql = `
    UPDATE teacher_schedules
    SET slot_course = ? 
    WHERE slot_time = ? AND slot_day = ?
  `;

  try {
    for (const s of schedules) {
      await pool.query(sql, [s.slot_course, s.slot_time, s.slot_day]);
    }

    res.status(200).json({ message: "Schedules updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RESET ALL SCHEDULES
scheduleRouter.delete("/reset-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE teacher_schedules SET slot_course = 0 WHERE slot_course NOT IN (0, 2)`
    );
    await pool.query(
      `UPDATE room_schedules SET slot_course = 0 WHERE slot_course NOT IN (0, 2)`
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
