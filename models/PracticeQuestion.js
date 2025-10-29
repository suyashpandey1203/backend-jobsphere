const mongoose = require("mongoose");

const PracticeQuestionSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  final_code: {
    type: String,
    default: "",
  },
}, { timestamps: true });

// ✅ Correct model name
module.exports = mongoose.model("PracticeQuestion", PracticeQuestionSchema);
