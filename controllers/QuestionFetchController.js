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

    console.log("q:", question)
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
    
    console.log("go")
    // --- Step 3: Fetch Problem Data from LeetCode ---
    const problem = await fetchAtCoderProblem(link);
    if (!problem)
      return res
        .status(404)
        .json({ message: "Problem not found or invalid link" });

    // const q = result.data.question;
    console.log("question", problem);
    // --- Step 4: Generate Test Cases (Visible + Hidden) ---
    const generatedCases = await generateTestCases(
      problem.title,
      problem.statement,
      // q.exampleTestcases
    );
    // console.log(generatedCases);
    const runTestCases = generatedCases.slice(0,3);
    const hiddenTestCases = generatedCases.slice(3);
    // --- Step 5: Create Question in DB ---
    const question = await Question.create({
      assessment: assessmentId,
      added_by: interviewerId,
      title: problem.title,
      description: problem.statement,
      url: link,
      difficulty: problem.difficulty || "Medium",
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


// 🎯 Get 5 random questions with only id & title
const getRandomQuestions = async (req, res) => {
  try {
    const questions = await Question.aggregate([
      { $sample: { size: 5 } }, // randomly pick 5 documents
      { $project: { _id: 1, title: 1 , url: 1} } // only return _id and title
    ]);

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching random questions',
    });
  }
};



module.exports = {
  addQuestionWithLink,
  getQuestionById,
  getAllAssessmentQuestions,
  deleteQuestion,
  runCandidateCode,
  addQuestionWithLinkUseAtcoder,
  getRandomQuestions
};
