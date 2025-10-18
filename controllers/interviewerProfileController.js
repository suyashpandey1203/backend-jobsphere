const { Interviewer } = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// GET interviewer profile
exports.getProfile = async (req, res) => {
  try {
    const user = await Interviewer.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Interviewer not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE interviewer profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, company, department, position } = req.body;
    const user = await Interviewer.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Interviewer not found" });

    if (name) user.name = name;
    if (company) user.company = company;
    if (department) user.department = department;
    if (position) user.position = position;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPLOAD interviewer files
exports.uploadFiles = async (req, res) => {
  try {
    const user = await Interviewer.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Interviewer not found" });

    const profilePicFile = req.files?.profilePic?.[0];
    const companyProofFile = req.files?.companyProof?.[0];

    let uploadedFiles = {};

    if (profilePicFile) {
      const uploadRes = await cloudinary.uploader.upload(profilePicFile.path, { folder: "profiles" });
      user.profilePic = uploadRes.secure_url;
      fs.unlinkSync(profilePicFile.path);
      uploadedFiles.profilePic = uploadRes.secure_url;
    }

    if (companyProofFile) {
      const uploadRes = await cloudinary.uploader.upload(companyProofFile.path, {
        folder: "documents",
        resource_type: "raw",
      });
      user.document_url = uploadRes.secure_url; // same property for frontend
      console.log("upload: ",uploadRes, " ",user.document_url)
      uploadedFiles.document = uploadRes.secure_url;
      fs.unlinkSync(companyProofFile.path);
    }


    await user.save();

    res.json({ message: "Files uploaded", user, uploadedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

