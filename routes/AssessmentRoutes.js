const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/AssessmentController');
const { protectInterviewer } = require('../middlewares/authMiddleware');

// Specific routes first 👇
router.get('/latest', protectInterviewer,assessmentController.getLatestAssessments);

router.get("/my-assessments", protectInterviewer,  assessmentController.getMyAssessments);

router.post('/', protectInterviewer, assessmentController.createAssessment);

// Dynamic routes later 👇
router.get('/:id', protectInterviewer, assessmentController.getAssessmentDetails);

router.post('/:id/invite', protectInterviewer,assessmentController.inviteParticipant);

module.exports = router;
