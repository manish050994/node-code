const teacherService = require('../services/teacherService');
const ApiError = require('../utils/ApiError');
const { stringify } = require('csv-stringify');

exports.getSampleCsv = async (req, res, next) => {
  try {
    const sampleData = [
      {
        name: 'Jane Smith',
        loginId: 'jane.smith_teacher',
        employeeId: 'T001',
        email: 'jane.smith@example.com',
        password: 'pass123',
      },
      {
        name: 'Bob Johnson',
        loginId: 'bob.johnson_teacher',
        employeeId: 'T002',
        email: 'bob.johnson@example.com',
        password: 'pass123',
      },
    ];

    const columns = [
      'name',
      'loginId',
      'employeeId',
      'email',
      'password',
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
    const { teacher, user } = await teacherService.createTeacher(req.body, req.user.collegeId); // Fixed: req.user.collegeId (integer)
    return res.success({ teacher, user }, 'Teacher created'); // Password hashed in user
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

exports.getTeachers = async (req, res, next) => {
  try {
    const options = { collegeId: req.user.collegeId }; // Fixed: req.user.collegeId
    if (req.query.page || req.query.limit) options.page = parseInt(req.query.page); options.limit = parseInt(req.query.limit);
    const list = await teacherService.getTeachers(options);
    return res.success(list, 'Teachers fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const t = await teacherService.updateTeacher({ id: parseInt(req.params.id), payload: req.body });
    return res.success(t, 'Teacher updated');
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