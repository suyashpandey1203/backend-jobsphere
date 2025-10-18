const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1️⃣ Define the Base Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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

  // 🌟 Common field for all users
  profilePic: {
    type: String,
    default: "", // Cloudinary URL or blank
  },

}, {
  timestamps: true,
  discriminatorKey: 'role',
});

// 2️⃣ Password Hashing Middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 3️⃣ Password Comparison Method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 4️⃣ Create Base Model
const User = mongoose.model('User', UserSchema);

// 5️⃣ Create Discriminators (Specialized roles)

// 🧑‍💼 INTERVIEWER SCHEMA (Company, Department, Position)
const Interviewer = User.discriminator('interviewer', new mongoose.Schema({
  company: { type: String, required: false },
  department: { type: String, required: false },
  position: { type: String, required: false }, // 🌟 Newly added field
  companyProof: { type: String },
}));

// 👨‍💻 CANDIDATE SCHEMA (Resume, Portfolio)
const Candidate = User.discriminator('candidate', new mongoose.Schema({
  resume_url: { type: String },
  education: { type: String },
  skills: { type: [String] },
  experience: { type: String },
}));

// 6️⃣ Export All Models
module.exports = { User, Interviewer, Candidate };
