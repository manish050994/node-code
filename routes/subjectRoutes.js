// routes\subjectRoutes.js (featureAuthorize)
const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('courseManagement'));

router.get('/', protect, getSubjects);
router.post('/', protect, authorize('collegeadmin','superadmin'), createSubject);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateSubject);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteSubject);

module.exports = router;