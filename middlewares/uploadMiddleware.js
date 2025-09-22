// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in an 'uploads' directory (create it if it doesn't exist)
    const uploadDir = path.join(__dirname, '../uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to allow only CSV files
const fileFilter = (req, file, cb) => {
  const filetypes = /csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new ApiError.badRequest('Only CSV files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5MB
  },
});

// Custom middleware to handle Multer errors
const uploadMiddleware = (req, res, next) => {
  upload.single('csvFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(ApiError.badRequest(`Upload error: ${err.message}`));
    } else if (err) {
      return next(err);
    }
    if (!req.file) {
      return next(ApiError.badRequest('No file uploaded'));
    }
    next();
  });
};

module.exports = upload; // Export the Multer instance