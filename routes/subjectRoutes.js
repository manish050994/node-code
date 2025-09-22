// routes\subjectRoutes.js (featureAuthorize)
const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.get('/', protect, featureAuthorize('courseManagement'), getSubjects);
router.post('/', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), createSubject);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), updateSubject);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), deleteSubject);

module.exports = router;