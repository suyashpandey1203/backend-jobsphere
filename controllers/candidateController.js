const { Candidate } = require("../models/User");
const jwt = require("jsonwebtoken");

// 🔹 Helper: Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, resume_url, portfolio_url } = req.body;
    console.log(req.body)
    const existingUser = await Candidate.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newCandidate = await Candidate.create({
      name,
      email,
      password,
      resume_url,
      portfolio_url,
    });

    res.status(201).json({
      message: "Candidate signup successful! Please login.",
      user: { id: newCandidate._id, name: newCandidate.name, email: newCandidate.email },
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

    const candidate = await Candidate.findOne({ email });
    if (!candidate) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await candidate.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(candidate._id, "candidate");

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Candidate login successful",
      user: { id: candidate._id, name: candidate.name, role: "candidate" },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- LOGOUT -----------------
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- DELETE ACCOUNT -----------------
exports.deleteAccount = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Candidate.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    await Candidate.findByIdAndDelete(decoded.id);

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

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
    const user = await Candidate.findById(decoded.id);

    if (!user) return res.json({ loggedIn: false });

    res.json({
      loggedIn: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "candidate",
      },
    });
  } catch (error) {
    res.json({ loggedIn: false });
  }
};
