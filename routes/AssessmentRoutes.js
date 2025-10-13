const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/AssessmentController');
const { protect } = require('../middlewares/authMiddleware');



// --- Routes for Assessments ---

// @route   POST api/assessments
// @desc    Create a new assessment
// @access  Private (requires authentication)
router.post('/',protect , assessmentController.createAssessment);


router.get("/my-assessments", protect,assessmentController.getMyAssessments);

// @route   GET api/assessments/:id
// @desc    Get full details for a single assessment
// @access  Private
router.get('/:id', protect ,assessmentController.getAssessmentDetails);

// @route   POST api/assessments/:id/invite
// @desc    Invite a participant (interviewer or candidate) to an assessment
// @access  Private
router.post('/:id/invite',protect , assessmentController.inviteParticipant);


module.exports = router;
