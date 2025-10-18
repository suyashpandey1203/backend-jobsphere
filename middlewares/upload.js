const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Disk storage for temporary uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir); // temporary folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to allow images and documents
const fileFilter = (req, file, cb) => {
  const allowedImages = ["image/jpeg", "image/png", "image/jpg"];
  const allowedDocs = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (file.fieldname === "profilePic") {
    allowedImages.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Profile picture must be an image"), false);
  } else if (file.fieldname === "resume" || file.fieldname === "companyProof") {
    allowedDocs.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Document must be PDF/DOC/DOCX"), false);
  } else {
    cb(new Error("Unknown field"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

module.exports = upload;
