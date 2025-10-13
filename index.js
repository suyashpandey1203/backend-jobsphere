// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

// Route and Socket Handler Imports
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require('./routes/problemRoutes');
const QuestionFetchRouter = require("./routes/QuestionFetchRouter");
const assessmentRoutes = require("./routes/AssessmentRoutes");
const interviewerRoutes = require("./routes/interviewerRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const codeRoutes = require("./routes/codeRoutes");
const socketHandler = require("./sockets/socketHandler");
const collabHandler = require("./sockets/collabSocket");

// --- Initialization ---
const app = express();
const server = http.createServer(app);

// --- Frontend Origin (use env var) ---
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

// --- Default Cookie Options ---
const defaultCookieOptions = {
  httpOnly: true,
  secure: false,      // set true in production with HTTPS
  sameSite: "lax",    // 'lax' is fine for localhost cross-port; use 'none' + secure:true in prod if cross-site
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
app.locals.cookieOptions = defaultCookieOptions;

// If behind a proxy (e.g. nginx) in production, enable:
// app.set('trust proxy', 1); // uncomment in production and set secure:true in cookie options

// --- CORS Configuration ---
const corsOptions = {
  origin: frontendURL, // exact origin (protocol + host + port)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,   // required to allow cookies
  allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie", "Cookie"],
  optionsSuccessStatus: 200,
};

// enable CORS for all routes (this also handles preflight for registered routes)
app.use(cors(corsOptions));

// If you still need an explicit global OPTIONS responder (avoid '*' because some path-to-regexp versions break):
// app.options(/.*/, cors(corsOptions)); // <-- uncomment only if you actually need an explicit fallback

// --- Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/problem', problemRoutes);
app.use("/api/questions", QuestionFetchRouter);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/interviewer", interviewerRoutes);
app.use("/api/candidate", candidateRoutes);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: frontendURL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// General connection handler
io.on("connection", (socket) => socketHandler(io, socket));
// Collaboration namespace/room handler
collabHandler(io);

// --- Database and Server Startup ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
