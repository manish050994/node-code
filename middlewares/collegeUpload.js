// middlewares/collegeUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Base upload folder
const baseUploadDir = path.join(__dirname, '..', 'collegeProfile');

// Ensure folders exist
['', 'signature', 'stamp'].forEach(folder => {
  const dir = path.join(baseUploadDir, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage function
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'signature') cb(null, path.join(baseUploadDir, 'signature'));
    else if (file.fieldname === 'stamp') cb(null, path.join(baseUploadDir, 'stamp'));
    else cb(null, baseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new ApiError(400, 'Only JPG, JPEG, PNG files are allowed'), false);
};

// Multer instance
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
