// // routes/interviewerRoutes.js
const express = require("express");
const { signup, login, logout, deleteAccount, verifyAuth } = require("../controllers/interviewerController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.delete("/delete", protect, deleteAccount);


// //auth check

router.get("/verify", verifyAuth);

module.exports = router;
