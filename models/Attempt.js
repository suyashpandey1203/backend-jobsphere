const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // This ID refers to the specific question object inside the Assessment's `questions` array
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    
    // Stores the final state for quick viewing after the interview
    final_code: {
        type: String,
        default: '',
    },
    // Can store SVG data or a JSON representation of shapes
    final_whiteboard_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // --- For Playback Functionality ---
    // Stores the sequence of code changes (deltas)
    code_events: [{
        timestamp: Date,
        event_data: mongoose.Schema.Types.Mixed,
    }],
    // Stores the sequence of drawing actions
    whiteboard_events: [{
        timestamp: Date,
        event_data: mongoose.Schema.Types.Mixed,
    }],
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Attempt', attemptSchema);