const express = require('express');
const router = express.Router();
const { fetchAtCoderProblem } = require('../controllers/problemController');

// GET /api/problem
router.get('/', fetchAtCoderProblem);

module.exports = router;
