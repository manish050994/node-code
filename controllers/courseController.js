// controllers\courseController.js (unchanged, but service updated for links)
const courseService = require('../services/courseService');

exports.createCourse = async (req, res, next) => {
  try {
    const c = await courseService.createCourse(req.body, req.user.collegeId);
    return res.success(c, 'Course created');
  } catch (err) {
    return next(err);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await courseService.getCourses(req.user.collegeId, { 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    return res.success(list, 'Courses fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const c = await courseService.updateCourse({ id: req.params.id, payload: req.body });
    return res.success(c, 'Course updated');
  } catch (err) {
    return next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse({ id: req.params.id });
    return res.success(result, 'Course deleted');
  } catch (err) {
    return next(err);
  }
};