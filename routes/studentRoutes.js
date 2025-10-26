// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getSampleCsv, 
    createStudent, 
    getStudents, 
    getStudent, 
    updateStudent, 
    deleteStudent, 
    bulkCreateStudents, 
    generateIdCard,
    exportStudents,
    getOwnIdCard,
    getStudentProfile,
    updateOwnProfile
} = require('../controllers/studentController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer'); // For CSV uploads
const studentProfileUpload = require('../middlewares/studentProfileUpload'); // For profile image uploads

router.get('/sample-csv', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), getSampleCsv);
router.get('/', protect, featureAuthorize('studentManagement'), getStudents);
router.post('/', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), createStudent);
router.post('/bulk', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), upload.single('file'), bulkCreateStudents);
router.get('/:id', protect, featureAuthorize('studentManagement'), getStudent);
router.put('/:id', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), studentProfileUpload.single('profilePic'), updateStudent);
router.delete('/:id', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), deleteStudent);
router.get('/:id/idcard', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), generateIdCard);
router.get('/me/id_card', protect, authorize('student'), featureAuthorize('studentManagement'), getOwnIdCard);
router.get('/me/profile', protect, authorize('student'), featureAuthorize('studentManagement'), getStudentProfile);
router.put('/me/profile', protect, authorize('student'), featureAuthorize('studentManagement'), studentProfileUpload.single('profilePic'),updateOwnProfile);


module.exports = router;