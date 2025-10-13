const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


//local imports
const authRoutes = require("./routes/authRoutes");
const QuestionFetchRouter = require("./routes/QuestionFetchRouter");
const socketHandler = require("./sockets/socketHandler");
const assessmentRoutes = require("./routes/AssessmentRoutes");
const interviewerRoutes = require("./routes/interviewerRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

const codeRoutes = require("./routes/codeRoutes");
const problemRoutes = require('./routes/problemRoutes')
const collabHandler = require("./sockets/collabSocket")


require("dotenv").config();
console.log(process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"], 
    credentials: true,
  },
});

app.use(cors(
  {
    origin: "http://localhost:5173",
    credentials: true,
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use("/api/auth", authRoutes);
// app.get("/", (req,res) => {
//   res.send("hello")
// });

app.use('/api/problem', problemRoutes);

app.use("/api/questions", QuestionFetchRouter);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/interviewer", interviewerRoutes);
app.use("/api/candidate", candidateRoutes);

// Socket.io
io.on("connection", (socket) => socketHandler(io, socket));
collabHandler(io);

// ✅ Routes
app.use("/api/auth", authRoutes);


// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
