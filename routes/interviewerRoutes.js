// routes/interviewerRoutes.js
const express = require("express");
const router = express.Router();
const { protectInterviewer } = require("../middlewares/authMiddleware");

const {
  signup,
  login,
  logout,
  deleteAccount,
  verifyAuth,
} = require("../controllers/interviewerController");

const interviewerProfileController = require("../controllers/interviewerProfileController")
const upload = require("../middlewares/upload"); // updated multer

// ----------------- AUTH -----------------
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", verifyAuth);

// ----------------- PROFILE -----------------
router.get('/profile', protectInterviewer, interviewerProfileController.getProfile);
router.post('/profile/update', protectInterviewer, interviewerProfileController.updateProfile);
router.post(
  "/profile/upload",
  protectInterviewer,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "companyProof", maxCount: 1 },
  ]),
  interviewerProfileController.uploadFiles
);


// ----------------- DELETE ACCOUNT -----------------
router.delete("/delete", protectInterviewer, deleteAccount);

module.exports = router;
