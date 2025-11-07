const express = require("express");
const roomRouter = express.Router();
const pool = require("../config/db"); // mysql2/promise pool

// ROUTE BASE: /api/rooms

// GET all rooms
roomRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rooms");
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

// GET the teacher's assigned rooms
roomRouter.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    const sql =
      teacherId != 0
        ? `
          SELECT tr.room_id, r.room_name
          FROM teacher_assigned_room tr
          INNER JOIN rooms r ON tr.room_id = r.room_id
          WHERE tr.teacher_id = ?
        `
        : `SELECT room_id, room_name FROM rooms`;

    const params = teacherId != 0 ? [teacherId] : [];

    const [rows] = await pool.query(sql, params);

    if (rows.length === 0)
      return res.status(404).json({ message: "No rooms for this teacher" });

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

// GET room by ID
roomRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM rooms WHERE room_id = ?", [
      id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Room not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

// CREATE new room
roomRouter.post("/", async (req, res) => {
  try {
    const { room_name } = req.body;

    if (!room_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO rooms (room_name) VALUES (?)",
      [room_name]
    );

    res.status(201).json({
      message: "Room created successfully",
      room_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

// UPDATE room by ID
roomRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name } = req.body;

    const [result] = await pool.query(
      "UPDATE rooms SET room_name = ? WHERE room_id = ?",
      [room_name, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Room not found" });

    res.status(200).json({ message: "Room updated successfully" });
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

// DELETE room by ID
roomRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM rooms WHERE room_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Room not found" });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: `An error has occurred: ${err.message}` });
  }
});

module.exports = roomRouter;
