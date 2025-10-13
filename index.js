require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// --- Routes & Socket Handlers ---
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require('./routes/problemRoutes');
const QuestionFetchRouter = require("./routes/QuestionFetchRouter");
const assessmentRoutes = require("./routes/AssessmentRoutes");
const interviewerRoutes = require("./routes/interviewerRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const codeRoutes = require("./routes/codeRoutes");
const socketHandler = require("./sockets/socketHandler");
const collabHandler = require("./sockets/collabSocket");

// --- Initialize Express & HTTP server ---
const app = express();
const server = http.createServer(app);

// --- Allowed Frontend Origins ---
const allowedOrigins = [
  "http://localhost:5173",                   // local dev
  process.env.FRONTEND_URL,                  // deployed frontend
].filter(Boolean); // removes undefined if FRONTEND_URL not set

// --- Middleware ---
const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
app.locals.cookieOptions = defaultCookieOptions;

// Dynamic CORS setup
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    }
    return callback(null, true);
  },
  methods: ["GET","HEAD","PUT","PATCH","POST","DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie", "Cookie"],
  optionsSuccessStatus: 200,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Namespaces / Rooms
io.on("connection", (socket) => socketHandler(io, socket));
collabHandler(io);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error("⚠️  Server Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// --- Database & Server Start ---
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
