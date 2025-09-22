// New route: routes\markRoutes.js
const express = require('express');
const router = express.Router();
const { addMark, getMarks } = require('../controllers/markController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('assessment'));

router.post('/', protect, authorize('teacher'), addMark);
router.get('/', protect, authorize('teacher', 'student', 'parent'), getMarks);

module.exports = router;