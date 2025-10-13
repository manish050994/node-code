// routes\subjectRoutes.js (featureAuthorize)
const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, updateSubject, deleteSubject, getSubjectsByCourse  } = require('../controllers/subjectController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.get('/', protect, featureAuthorize('courseManagement'), getSubjects);
router.post('/', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), createSubject);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), updateSubject);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), deleteSubject);
router.get('/by-course/:courseId', protect, featureAuthorize('courseManagement'), getSubjectsByCourse);


module.exports = router;