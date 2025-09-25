// controllers/studentController.js
const ApiError = require('../utils/ApiError');
const studentService = require('../services/studentService');
const { generatePdf } = require('../utils/pdfExport');
const { stringify } = require('csv-stringify');
const db = require('../models');

exports.getSampleCsv = async (req, res, next) => {
  try {
    // Fetch valid courseIds for the college
    const courses = await db.Course.findAll({
      where: { collegeId: req.user.collegeId },
      attributes: ['id'],
    });
    if (!courses.length) {
      throw ApiError.badRequest('No courses found for your college. Please create a course first.');
    }
    const courseId = courses[0].id; // Use the first available courseId

    const sampleData = [
      {
        name: 'John Doe',
        rollNo: '001',
        courseId, // Use dynamic courseId
        year: 1,
        section: 'A',
        email: 'john.doe@example.com',
        password: 'pass123',
        parentName: 'Parent Doe',
        parentEmail: 'parent.doe@example.com',
        parentPhone: '1234567890',
        parentPassword: 'parentPass123',
      },
      {
        name: 'Jane Roe',
        rollNo: '002',
        courseId, // Use dynamic courseId
        year: 1,
        section: 'A',
        email: 'jane.roe@example.com',
        password: 'pass123',
        parentName: 'Parent Roe',
        parentEmail: 'parent.roe@example.com',
        parentPhone: '0987654321',
        parentPassword: 'parentPass123',
      },
    ];

    const columns = [
      'name',
      'rollNo',
      'courseId',
      'year',
      'section',
      'email',
      'password',
      'parentName',
      'parentEmail',
      'parentPhone',
      'parentPassword',
    ];

    stringify(sampleData, {
      header: true,
      columns,
    }, (err, output) => {
      if (err) {
        return next(ApiError.internal('Failed to generate sample CSV'));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students-sample.csv"');
      res.send(output);
    });
  } catch (error) {
    next(ApiError.internal(`Failed to generate sample CSV: ${error.message}`));
  }
};



exports.createStudent = async (req, res, next) => {
  try {
    const creator = req.user;
    const payload = req.body;
    const result = await studentService.createStudent({ payload, creator });
    return res.success(result, 'Student created successfully');
  } catch (err) {
    return next(err);
  }
};


exports.bulkCreateStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 0,
        message: 'CSV file is required',
        data: null,
        error: 'No file uploaded'
      });
    }

    const { students, failedRows } = await studentService.bulkCreateStudents(
      req.file.path,
      req.user.collegeId
    );

    return res.status(200).json({
      status: 1,
      message: 'Bulk student creation completed',
      data: {
        created: students,
        failed: failedRows
      },
      error: failedRows.length > 0 ? 'Some rows failed' : null
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: err.message || 'Bulk create failed',
      data: null,
      error: err.stack || err
    });
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await studentService.getStudents({ q: req.query, collegeId: req.user.collegeId, page: parseInt(page), 
      limit: parseInt(limit) }); // Fixed: req.user.collegeId
    return res.success(list, 'Students fetched');
  } catch (err) {
    return next(err);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudent({ id: parseInt(req.params.id) });
    return res.success(student, 'Student fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const updated = await studentService.updateStudent({ id: parseInt(req.params.id), payload: req.body });
    return res.success(updated, 'Student updated');
  } catch (err) {
    return next(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const result = await studentService.deleteStudent({ id: parseInt(req.params.id) });
    return res.success(result, 'Student deleted');
  } catch (err) {
    return next(err);
  }
};

exports.generateIdCard = async (req, res, next) => {
  try {
    const html = await studentService.getIdCardHtml(parseInt(req.params.id));
    const pdf = generatePdf(html);
    res.contentType('application/pdf');
    res.send(pdf);
  } catch (err) {
    return next(err);
  }
};


exports.exportStudents = async (req, res, next) => {
  try {
    const { students } = await studentService.getStudents({
      q: req.query,
      collegeId: req.user.collegeId,
      page: 1,
      limit: 1000, // Large limit for export
      user: req.user,
    });
    const data = students.map(s => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      email: s.email,
      course: s.Course?.name,
      parent: s.Parent?.name,
    }));
    const buffer = await exportToExcel(data, ['id', 'name', 'rollNo', 'email', 'course', 'parent'], 'Students');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(ApiError.internal('Failed to export students'));
  }
};