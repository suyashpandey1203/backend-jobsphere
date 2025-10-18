const { Candidate } = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// GET candidate profile
exports.getProfile = async (req, res) => {
  try {
    const user = await Candidate.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Candidate not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE candidate profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, education, skills, experience } = req.body;
    const user = await Candidate.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Candidate not found" });

    if (name) user.name = name;
    if (education) user.education = education;
    if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim());
    if (experience) user.experience = experience;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPLOAD candidate files
exports.uploadFiles = async (req, res) => {
  try {
    const user = await Candidate.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Candidate not found" });

    const profilePicFile = req.files?.profilePic?.[0];
    const resumeFile = req.files?.resume?.[0]; // rename to match Multer

    const uploadedFiles = {}; // To return uploaded URLs

    if (profilePicFile) {
      const uploadRes = await cloudinary.uploader.upload(profilePicFile.path, { folder: "profiles" });
      user.profilePic = uploadRes.secure_url;
      uploadedFiles.profilePic = uploadRes.secure_url;
      fs.unlinkSync(profilePicFile.path);
    }

    if (resumeFile) {
      const uploadRes = await cloudinary.uploader.upload(resumeFile.path, {
        folder: "documents",
        resource_type: "auto",
      });
      user.document_url = uploadRes.secure_url;  // this is what frontend reads
      uploadedFiles.document = uploadRes.secure_url;
      fs.unlinkSync(resumeFile.path);
    }

    await user.save();

    res.json({ message: "Files uploaded", uploadedFiles, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

