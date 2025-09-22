// controllers\collegeController.js (modified: added toggleFeature)
const collegeService = require('../services/collegeService');

exports.addCollege = async (req, res, next) => {
  try {
    const { name, code, address, admin } = req.body;
    const college = await collegeService.addCollege({ name, code, address, admin, actor: req.user.email });
    return res.success(college, 'College added');
  } catch (err) {
    return next(err);
  }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const college = await collegeService.updateCollege({ id, updates });
    return res.success(college, 'College updated');
  } catch (err) {
    return next(err);
  }
};

exports.toggleCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await collegeService.toggleCollege({ id, actor: req.user.email });
    return res.success(college, 'College toggled');
  } catch (err) {
    return next(err);
  }
};

exports.listColleges = async (req, res, next) => {
  try {
    const { page, limit } = req.query; // Extract page and limit from query params
    const list = await collegeService.listColleges({ page: parseInt(page), limit: parseInt(limit) });
    return res.success(list, 'Colleges listed');
  } catch (err) {
    return next(err);
  }
};

exports.deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await collegeService.deleteCollege({ id, actor: req.user.email });
    return res.success({ message: 'College deleted successfully', college }, 'College deleted');
  } catch (err) {
    return next(err);
  }
};

exports.toggleFeature = async (req, res, next) => {
  try {
    const { id, feature } = req.params;
    const college = await collegeService.toggleFeature({ id, feature });
    return res.success(college, 'Feature toggled');
  } catch (err) {
    return next(err);
  }
};