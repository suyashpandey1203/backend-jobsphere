const PracticeQuestion = require("../models/PracticeQuestion");
const AssessmentParticipant = require("../models/AssessmentParticipant");
const { Candidate } = require("../models/User");
const jwt = require("jsonwebtoken");

// 🔹 Helper: Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  // ... (No changes needed here)
  try {
    const { name, email, password, resume_url, portfolio_url } = req.body;
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

    // ✅ Use the shared cookie options from app.locals
    res.cookie("token", token, req.app.locals.cookieOptions);

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
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Candidate.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Candidate.findByIdAndDelete(decoded.id);

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


exports.getMyAssessments = async (req, res) => {
  try {
    const candidateId = req.user._id;
    console.log(candidateId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assessments = await AssessmentParticipant.find({
      user: candidateId,
      role: "candidate",
    })
      .populate({
        path: "assessment",
        match: { date: { $gte: today } }, // Only future/upcoming
      })
      .sort({ "assessment.date": 1 });

    const upcoming = assessments
      .filter((ap) => ap.assessment)
      .map((ap) => ap.assessment);

    res.status(200).json({ assessments: upcoming });
  } catch (error) {
    console.error("Get My Assessments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.fetchAttemptCode = async (req, res) => {
  try {
    const { questionId, userId } = req.body;

    if (!questionId || !userId) {
      return res.status(400).json({ message: "questionId and userId are required" });
    }

    // Find existing attempt
    let attempt = await PracticeQuestion.findOne({
      question_id: questionId,
      candidate: userId,
    });

    if (!attempt) {
      // If not found, return default code
      return res.json({ final_code: "// Start coding here..." });
    }

    res.json({ final_code: attempt.final_code });
  } catch (err) {
    console.error("Error in fetchAttempt:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// controllers/practiceController.js
exports.saveAttemptCode = async (req, res) => {
  try {
    const { questionId, userId, final_code } = req.body;

    if (!questionId || !userId || final_code === undefined) {
      return res.status(400).json({ message: "questionId, userId and final_code are required" });
    }

    // Find existing attempt
    let attempt = await PracticeQuestion.findOne({
      question_id: questionId,
      candidate: userId,
    });

    if (!attempt) {
      // Create new if not found
      attempt = new PracticeQuestion({
        question_id: questionId,
        candidate: userId,
        final_code,
      });
    } else {
      // Update existing
      attempt.final_code = final_code;
    }

    await attempt.save();

    res.json({ final_code: attempt.final_code });
  } catch (err) {
    console.error("Error in saveAttempt:", err);
    res.status(500).json({ message: "Server error" });
  }
};

