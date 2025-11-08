const express = require("express");
const userRouter = express.Router();
const pool = require("../config/db");
const { verifyRole } = require("../middleware/authMiddleware");

// ROUTE: /api/users

// Get all users
userRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, full_name, email, created_at FROM profiles"
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch users" });
  }
});

// Get user by ID
userRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, created_at, change_password FROM profiles WHERE id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch users" });
  }
});

// ASSIGN ROLE to user
userRouter.put("/:user_id", async (req, res) => {
  const { assignRole } = req.body;
  const { user_id } = req.params;

  try {
    await pool.query("UPDATE profiles SET role = ? WHERE id = ?", [
      assignRole,
      user_id,
    ]);

    res.status(200).json(`User Id ${user_id} role successfully updated.`);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

// REQUEST CHANGE PASSWORD FLAG // ANYONE
userRouter.put("/:user_id/request-change-password", async (req, res) => {
  const { user_id } = req.params;

  try {
    await pool.query(
      `UPDATE profiles SET change_password = "pending" WHERE id = ?`,
      [user_id]
    );

    res.status(200).json({ message: "Password request successful" });
  } catch (error) {
    res.status(500).json({ message: "Error requesting password change" });
  }
});

// APPROVE CHANGE PASSWORD FLAG // ADMIN ONLY
userRouter.put("/:user_id/approve-password-request", async (req, res) => {
  const { user_id } = req.params;

  try {
    await pool.query(
      `UPDATE profiles SET change_password = "approved" WHERE id = ?`,
      [user_id]
    );

    res.status(200).json({ message: "Approve successful" });
  } catch (error) {
    res.status(500).json({ message: "Error requesting password change" });
  }
});

// DELETE USER
userRouter.delete("/:user_id", verifyRole(["admin"]), async (req, res) => {
  const { user_id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM profiles WHERE id = ?", [
      user_id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: `User Id: ${user_id} has been deleted` });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

module.exports = userRouter;
