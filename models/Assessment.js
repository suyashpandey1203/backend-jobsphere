
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    room_id: {
        type: String,
        required: true,
        unique: true,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the interviewer who created it
        required: true,
    },
    // This is now an array of references to documents in the 'Question' collection
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Assessment', assessmentSchema);