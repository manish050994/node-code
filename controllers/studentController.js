// controllers/studentController.js
const studentService = require('../services/studentService');
const { generatePdf } = require('../utils/pdfExport');

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
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const result = await studentService.bulkCreateStudents(req.file.path, req.user);
    return res.success(result, 'Students bulk created');
  } catch (err) {
    return next(err);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const list = await studentService.getStudents({ q: req.query, collegeId: req.user.collegeId }); // Fixed: req.user.collegeId
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