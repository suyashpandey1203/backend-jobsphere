const mongoose = require('mongoose');

const assessmentParticipantSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['interviewer', 'candidate'], // Restricts the value to one of these
        required: true,
    },
    status: {
        type: String,
        enum: ['Invited', 'Accepted'],
        default: 'Invited', // Sets a default value if not provided
    },
}, { 
    timestamps: true 
});

// This compound index ensures that a user cannot be added to the same assessment more than once.
assessmentParticipantSchema.index({ assessment: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('AssessmentParticipant', assessmentParticipantSchema);