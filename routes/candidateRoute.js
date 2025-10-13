const express = require("express");
const router = express.Router();
const candidateAuthController = require("../controllers/candidateController");

// ✅ Candidate Authentication Routes
router.post("/signup", candidateAuthController.signup);
router.post("/login", candidateAuthController.login);
router.post("/logout", candidateAuthController.logout);
router.delete("/delete", candidateAuthController.deleteAccount);
router.get("/verify", candidateAuthController.verifyAuth);

module.exports = router;
