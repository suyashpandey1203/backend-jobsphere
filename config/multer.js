const multer = require("multer");

// Store files in memory (you can also use diskStorage if you want)
const storage = multer.diskStorage({}); 

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("File must be an image"), false);
    } else {
      cb(null, true);
    }
  },
});

module.exports = upload;
