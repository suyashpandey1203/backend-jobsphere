const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const { getProblemFromLink } = require("../utils/leetcoderFetcher");
const { generateTestCases } = require("../services/aiTestcaseGenerator");
const { fetchAtCoderProblem } = require("../utils/atcoderFetcher");

/**
 * Add a question to an assessment by fetching from link and saving to DB
 */
const addQuestionWithLink = async (req, res) => {
  try {
    const { link, assessmentId } = req.body;
    console.log(req.body);
    
    const interviewerId = req.user?._id; // optional if authentication added later
  
    // --- Step 1: Validate Inputs ---
    if (!link || !assessmentId)
      return res
        .status(400)
        .json({ message: "Link and assessmentId are required" });

    // --- Step 2: Ensure Assessment Exists ---
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment)
      return res.status(404).json({ message: "Assessment not found" });

    // --- Step 3: Fetch Problem Data from LeetCode ---
    const result = await getProblemFromLink(link);
    if (!result?.data?.question)
      return res
        .status(404)
        .json({ message: "Problem not found or invalid link" });

    const q = result.data.question;
    console.log("question", q);
    // --- Step 4: Generate Test Cases (Visible + Hidden) ---
    const generatedCases = await generateTestCases(
      q.title,
      q.content,
      q.exampleTestcases
    );
    console.log(generatedCases);
    const runTestCases = generatedCases.slice(0,3);
    const hiddenTestCases = generatedCases.slice(3);
    // --- Step 5: Create Question in DB ---
    const question = await Question.create({
      assessment: assessmentId,
      added_by: interviewerId,
      title: q.title,
      description: q.content,
      url: link,
      difficulty: q.difficulty || "Medium",
      runTestCases: runTestCases || [],
      hiddenTestCases: hiddenTestCases || [],
    });

    // --- Step 6: Link Question with Assessment ---
    assessment.questions.push(question._id);
    await assessment.save();

    // --- Step 7: Return Response ---
    return res.status(201).json({
      message: "Question fetched and added successfully!",
      question,
    });
  } catch (err) {
    console.error("Error in addQuestionWithLink:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

/**
 *  Get all questions for a given assessment
 */
const getAllAssessmentQuestions = async (req, res) => {
  try {
    const { assessment_id } = req.params;
    // console.log("dlfjlaf : ", req.params)
    if (!assessment_id)
      return res.status(400).json({ message: "Assessment ID required" });

    const questions = await Question.find({ assessment: assessment_id })
      .populate("added_by", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ questions });
  } catch (err) {
    console.error("Error in getQuestionsByAssessment:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


// GET /api/questions/getQuestionById/:questionsId for fetching in codingpanel page
const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    // console.log(req)

    // Validate ID format (optional but recommended)
    if (!questionId || questionId.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid question ID" });
    }

    // Find question by ID
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    // Return success response
    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching question",
      error: error.message,
    });
  }
};

/**
 *  Delete a specific question
 */
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const deleted = await Question.findByIdAndDelete(questionId);
    if (!deleted)
      return res.status(404).json({ message: "Question not found" });

    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error in deleteQuestion:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 *  Optional: Run candidate code against testcases
 * (For later - when you integrate code execution service)
 */
const runCandidateCode = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;

    // TODO: Integrate with code execution API (like Judge0 or your own sandbox)
    // For now, just send a dummy response
    return res.status(200).json({
      message: "Code executed successfully (mocked)",
      result: "All test cases passed ✅",
    });
  } catch (err) {
    console.error("Error in runCandidateCode:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};



const addQuestionWithLinkUseAtcoder = async (req, res) => {
  const { link, assessmentId } = req.body;
  console.log("Received request to add question. Link:", link, "AssessmentID:", assessmentId);

  // --- Step 1: Validate Inputs ---
  if (!link || !assessmentId) {
    return res.status(400).json({ message: "Link and assessmentId are required" });
  }

  // --- Step 2: Check Authentication ---
  if (!req.user || !req.user._id) {
    console.error("Authentication error: req.user is not available.");
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }
  const interviewerId = req.user._id;
  console.log(`Request authenticated for interviewerId: ${interviewerId}`);

  try {
    // --- Step 3: Ensure Assessment Exists ---
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.error(`Assessment not found for ID: ${assessmentId}`);
      return res.status(404).json({ message: "Assessment not found" });
    }
    console.log("Successfully found assessment:", assessment.name);

    // --- Step 4: Fetch Problem Data (with detailed error handling) ---
    let problem;
    try {
      console.log(`Attempting to fetch problem from AtCoder with link: ${link}`);
      problem = await fetchAtCoderProblem(link);
      if (!problem) {
        console.error("fetchAtCoderProblem returned null or undefined.");
        return res.status(404).json({ message: "Problem not found at the provided link or the link is invalid." });
      }
      console.log("Successfully fetched problem:", problem.title);
    } catch (fetchErr) {
      console.error("CRITICAL: fetchAtCoderProblem function threw an error:", fetchErr);
      return res.status(500).json({ message: "Failed to fetch problem data from the source.", error: fetchErr.message });
    }

    // --- Step 5: Generate Test Cases (with detailed error handling) ---
    let generatedCases;
    try {
      console.log("Attempting to generate test cases for:", problem.title);
      generatedCases = await generateTestCases(problem.title, problem.statement);
      if (!generatedCases || generatedCases.length === 0) {
          console.warn("generateTestCases returned no cases. Proceeding without test cases.");
          generatedCases = []; // Ensure it's an array to prevent slice errors
      }
      console.log(`Successfully generated ${generatedCases.length} test cases.`);
    } catch (genErr) {
      console.error("CRITICAL: generateTestCases function threw an error:", genErr);
      return res.status(500).json({ message: "Failed to generate test cases for the problem.", error: genErr.message });
    }
    
    const runTestCases = generatedCases.slice(0, 3);
    const hiddenTestCases = generatedCases.slice(3);

    // --- Step 6: Create Question in DB ---
    const question = await Question.create({
      assessment: assessmentId,
      added_by: interviewerId,
      title: problem.title,
      description: problem.statement,
      url: link,
      difficulty: problem.difficulty || "Medium",
      runTestCases: runTestCases,
      hiddenTestCases: hiddenTestCases,
    });
    console.log("Successfully created question in database with ID:", question._id);

    // --- Step 7: Link Question with Assessment ---
    assessment.questions.push(question._id);
    await assessment.save();
    console.log("Successfully linked question to assessment.");

    // --- Step 8: Return Response ---
    return res.status(201).json({
      message: "Question fetched and added successfully!",
      question,
    });

  } catch (err) {
    // This is a final catch-all for any other unexpected errors (e.g., database connection issues)
    console.error("A top-level error occurred in addQuestionWithLink:", err);
    return res.status(500).json({ message: "An unexpected server error occurred.", error: err.message });
  }
};

module.exports = {
  addQuestionWithLink,
  getQuestionById,
  getAllAssessmentQuestions,
  deleteQuestion,
  runCandidateCode,
  addQuestionWithLinkUseAtcoder
};
