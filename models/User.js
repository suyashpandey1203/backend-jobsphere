const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt

// 1. Define the Base Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    // role: {
    //     type: String,
    //     required: true,
    //     enum: ['interviewer', 'candidate'],
    // },
}, { 
    timestamps: true,
    discriminatorKey: 'role' 
});

// --- NEW: Password Hashing Middleware ---
// This function runs automatically BEFORE a document is saved to the database.
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// --- NEW: Password Comparison Method ---
// This adds a custom method to every user document to compare passwords.
UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        // Use bcrypt to compare the provided password with the stored hash
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};


// 2. Create the Base User Model
const User = mongoose.model('User', UserSchema);

// 3. Create Discriminators
const Interviewer = User.discriminator('interviewer', new mongoose.Schema({
    company: { type: String },
    department: { type: String },
}));

const Candidate = User.discriminator('candidate', new mongoose.Schema({
    resume_url: { type: String },
    portfolio_url: { type: String },
}));

// 4. Export all the models
module.exports = { User, Interviewer, Candidate };