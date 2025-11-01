const teacherService = require('../services/teacherService');
const ApiError = require('../utils/ApiError');
const { stringify } = require('csv-stringify');

exports.getSampleCsv = async (req, res, next) => {
  try {
    const sampleData = [
      {
        name: 'Jane Smith',
        employeeId: 'T001',
        email: 'jane.smith@example.com',
        password: 'teach123',
        gender: 'female', // New
        dob: '1980-01-01', // New (format YYYY-MM-DD)
        profilePhoto: '/path/to/photo.jpg', // New (optional)
        mobileNo: '9876543210', // New
        category: 'general', // New
      },
      {
        name: 'Bob Johnson',
        loginId: 'bob.johnson_teacher',
        employeeId: 'T002',
        email: 'bob.johnson@example.com',
        password: 'pass123',
        gender: 'female', // New
        dob: '1980-01-01', // New (format YYYY-MM-DD)
        profilePhoto: '/path/to/photo.jpg', // New (optional)
        mobileNo: '9876543210', // New
        category: 'general', // New
      },
    ];

    const columns = [
      'name', 'employeeId', 'email', 'password',
      'gender', 'dob', 'profilePhoto', 'mobileNo', 'category',
    ];

    stringify(sampleData, {
      header: true,
      columns,
    }, (err, output) => {
      if (err) {
        return next(ApiError.internal('Failed to generate sample CSV'));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="teachers-sample.csv"');
      res.send(output);
    });
  } catch (error) {
    next(ApiError.internal('Failed to generate sample CSV'));
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    // If a file is uploaded, attach its relative path
    if (req.file) {
      req.body.profilePhoto = `/teacherProfile/${req.file.filename}`;
    }

    const { teacher, user } = await teacherService.createTeacher(req.body, req.user.collegeId);
    return res.success({ teacher, user }, 'Teacher created');
  } catch (err) {
    return next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.profilePhoto = `/teacherProfile/${req.file.filename}`;
    }
    const t = await teacherService.updateTeacher({ id: parseInt(req.params.id), payload });
    return res.success(t, 'Teacher updated');
  } catch (err) {
    return next(err);
  }
};

exports.getTeachers = async (req, res, next) => {
  try {
    const options = {
      collegeId: req.user.collegeId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const list = await teacherService.getTeachers(options, req);
    return res.success(list, 'Teachers fetched');
  } catch (err) {
    return next(err);
  }
};

exports.getTeacherProfile = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherProfile(req.user.teacherId, req);
    return res.success(teacher, 'Teacher profile fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateTeacherProfile = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.profilePhoto = `/teacherProfile/${req.file.filename}`;
    }
    const teacher = await teacherService.updateTeacherProfile(req.user.teacherId, payload);
    return res.success(teacher, 'Teacher profile updated');
  } catch (err) {
    return next(err);
  }
};

exports.bulkCreateTeachers = async (req, res, next) => {
  try {
    // Assume file upload middleware sets req.file.path
    const result = await teacherService.bulkCreateTeachers(req.file.path, req.user.collegeId);
    return res.success(result, 'Teachers bulk created');
  } catch (err) {
    return next(err);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const result = await teacherService.deleteTeacher({ id: parseInt(req.params.id) });
    return res.success(result, 'Teacher deleted');
  } catch (err) {
    return next(err);
  }
};

exports.assignSubject = async (req, res, next) => {
  try {
    const t = await teacherService.assignSubject(parseInt(req.params.id), req.body.subjectId);
    return res.success(t, 'Subject assigned');
  } catch (err) {
    return next(err);
  }
};

exports.assignGroup = async (req, res, next) => {
  try {
    const t = await teacherService.assignGroup(parseInt(req.params.id), req.body.group);
    return res.success(t, 'Group assigned');
  } catch (err) {
    return next(err);
  }
};

exports.assignCourse = async (req, res, next) => {
  try {
    const t = await teacherService.assignCourse(parseInt(req.params.id), req.body.courseId);
    return res.success(t, 'Course assigned');
  } catch (err) {
    return next(err);
  }
};