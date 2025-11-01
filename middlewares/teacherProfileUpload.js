// middlewares/teacherProfileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Base upload folder for teacher profiles
const teacherProfileDir = path.join(__dirname, '..', 'teacherProfile');

// Ensure directory exists
if (!fs.existsSync(teacherProfileDir)) {
  fs.mkdirSync(teacherProfileDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, teacherProfileDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `teacher-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new ApiError(400, 'Only JPG, JPEG, and PNG files are allowed for profile pictures'), false);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
