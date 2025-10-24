// routes\studentRoutes.js (modified: added bulk, idcard, featureAuthorize)
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
    getOwnIdCard
    } = require('../controllers/studentController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');


router.get('/sample-csv', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), getSampleCsv);
router.get('/', protect,featureAuthorize('studentManagement'), getStudents);
router.post('/', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), createStudent);
router.post('/bulk', protect, authorize('collegeadmin'),featureAuthorize('studentManagement'), upload.single('file'), bulkCreateStudents);
router.get('/:id', protect,featureAuthorize('studentManagement'), getStudent);
router.put('/:id', protect, authorize('collegeadmin'),featureAuthorize('studentManagement'), updateStudent);
router.delete('/:id', protect, authorize('collegeadmin'),featureAuthorize('studentManagement'), deleteStudent);
router.get('/:id/idcard', protect, authorize('collegeadmin'),featureAuthorize('studentManagement'), generateIdCard);
router.get('/export', protect, authorize('collegeadmin'), featureAuthorize('studentManagement'), exportStudents);
router.get('/me/id_card', protect, authorize('student'), featureAuthorize('studentManagement'), getOwnIdCard);



module.exports = router;