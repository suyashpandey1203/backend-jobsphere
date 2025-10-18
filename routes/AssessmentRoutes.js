const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/AssessmentController');
const { protectInterviewer } = require('../middlewares/authMiddleware');

// Specific routes first 👇
router.get('/latest', protectInterviewer, (req, res, next) => {
  console.log("latest");
  next();
}, assessmentController.getLatestAssessments);

router.get("/my-assessments", protectInterviewer, (req, res, next) => {
  console.log("/my-assessments");
  next();
}, assessmentController.getMyAssessments);

router.post('/', protectInterviewer, (req, res, next) => {
  console.log("/");
  next();
}, assessmentController.createAssessment);

// Dynamic routes later 👇
router.get('/:id', protectInterviewer, (req, res, next) => {
  console.log(":id");
  next();
}, assessmentController.getAssessmentDetails);

router.post('/:id/invite', protectInterviewer, (req, res, next) => {
  console.log(":id/invite");
  next();
}, assessmentController.inviteParticipant);

module.exports = router;
