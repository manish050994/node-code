// controllers\subjectController.js (unchanged)
const subjectService = require('../services/subjectService');

exports.createSubject = async (req, res, next) => {
  try {
    const s = await subjectService.createSubject(req.body, req.user.collegeId);
    return res.success(s, 'Subject created');
  } catch (err) {
    return next(err);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await subjectService.getSubjects(req.user.collegeId, {page: parseInt(page), 
      limit: parseInt(limit)});
    return res.success(list, 'Subjects fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const s = await subjectService.updateSubject({ id: req.params.id, payload: req.body });
    return res.success(s, 'Subject updated');
  } catch (err) {
    return next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const result = await subjectService.deleteSubject({ id: req.params.id });
    return res.success(result, 'Subject deleted');
  } catch (err) {
    return next(err);
  }
};

exports.getSubjectsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const subjects = await subjectService.getSubjectsByCourse(courseId, req.user.collegeId);
    return res.success(subjects, 'Subjects fetched for course');
  } catch (err) {
    return next(err);
  }
};