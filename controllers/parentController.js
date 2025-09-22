// New controller: controllers\parentController.js
const parentService = require('../services/parentService');

exports.createParent = async (req, res, next) => {
  try {
    const result = await parentService.createParent(req.body, req.user.collegeId._id);
    return res.success(result, 'Parent created and credentials sent');
  } catch (err) {
    return next(err);
  }
};

exports.getParents = async (req, res, next) => {
  try {
    const list = await parentService.getParents(req.user.collegeId._id);
    return res.success(list, 'Parents fetched');
  } catch (err) {
    return next(err);
  }
};

exports.updateParent = async (req, res, next) => {
  try {
    const updated = await parentService.updateParent(req.params.id, req.body);
    return res.success(updated, 'Parent updated');
  } catch (err) {
    return next(err);
  }
};

exports.deleteParent = async (req, res, next) => {
  try {
    const result = await parentService.deleteParent(req.params.id);
    return res.success(result, 'Parent deleted');
  } catch (err) {
    return next(err);
  }
};