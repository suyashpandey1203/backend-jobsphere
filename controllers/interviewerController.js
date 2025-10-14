const { Interviewer } = require("../models/User");
const jwt = require("jsonwebtoken");

// 🔹 Helper: Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  // ... (No changes needed here)
  try {
    const { name, email, password, company, department } = req.body;

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
      user: { id: interviewer._id, name: interviewer.name, role: "interviewer" },
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

    // Note: 'decoded' was not defined here, using req.user.id
    await Interviewer.findByIdAndDelete(user.id);

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
  // ... (No changes needed here)
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
      },
    });
  } catch (error) {
    res.json({ loggedIn: false });
  }
};