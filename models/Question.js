const mongoose = require('mongoose');

// 1. Define a schema for a single test case
// Using Mongoose.Schema.Types.Mixed allows for flexible inputs/outputs 
// (e.g., numbers, strings, arrays of objects).
const testCaseSchema = new mongoose.Schema({
    input: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
     expected_output: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
}, { _id: false }); // _id: false prevents Mongoose from creating an _id for each test case sub-document

const questionSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    added_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'interviewer',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    url: {
        type: String,
    },
    description: {
        type: String,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
    },

    // --- NEW TEST CASE FEATURE ---
    // Test cases visible to the candidate
    runTestCases: [testCaseSchema],

    // Test cases not visible to the candidate, used for final validation
    hiddenTestCases: [testCaseSchema],

}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);