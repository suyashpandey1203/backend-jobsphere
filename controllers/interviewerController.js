const { Interviewer } = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// 🔹 Helper: Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, company, department, position } = req.body;

    const existingUser = await Interviewer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = await Interviewer.create({
      name,
      email,
      password,
      company,
      department,
      position,
    });

    res.status(201).json({
      message: "Interviewer signup successful! Please login.",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- LOGIN -----------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email)
    const interviewer = await Interviewer.findOne({ email });
    if (!interviewer) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await interviewer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(interviewer._id, "interviewer");

    // ✅ Use the shared cookie options from app.locals
    res.cookie("token", token, req.app.locals.cookieOptions);

    res.status(200).json({
      message: "Interviewer login successful",
      user: {
        id: interviewer._id,
        name: interviewer.name,
        email: interviewer.email,
        role: "interviewer",
        company: interviewer.company,
        department: interviewer.department,
        position: interviewer.position,
        profilePic: interviewer.profilePic || "",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- LOGOUT -----------------
exports.logout = async (req, res) => {
  try {
    // ✅ Use the shared cookie options for consistency
    res.clearCookie("token", req.app.locals.cookieOptions);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- DELETE ACCOUNT -----------------
exports.deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete profile pic from Cloudinary if exists
    if (user.profilePicPublicId) {
      try {
        await cloudinary.uploader.destroy(user.profilePicPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    await Interviewer.findByIdAndDelete(user._id);

    // ✅ Use the shared cookie options for consistency

    res.clearCookie("token", req.app.locals.cookieOptions);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- VERIFY AUTH -----------------
exports.verifyAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json({ loggedIn: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Interviewer.findById(decoded.id);

    if (!user) return res.json({ loggedIn: false });

    res.json({
      loggedIn: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "interviewer",
        company: user.company,
        department: user.department,
        position: user.position,
        profilePic: user.profilePic || "",
      },
    });
  } catch (error) {
    res.json({ loggedIn: false });
  }
};