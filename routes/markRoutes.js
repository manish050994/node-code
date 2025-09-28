// routes/markRoutes.js
const express = require('express');
const router = express.Router();
const { addMark, getMarks } = require('../controllers/markController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('teacher'), featureAuthorize('assessment'), addMark);
router.get('/', protect, authorize('teacher', 'student', 'parent'), featureAuthorize('assessment'), getMarks);

module.exports = router;
