const express = require("express");
const router = express.Router();
const User = require("../models/User");   // make sure model path is correct

// ➕ Add User (Test route)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Create user
    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📥 Get All Users (for testing)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
