// New controller: controllers\parentController.js
const parentService = require('../services/parentService');
const db = require('../models');
const ApiError = require('../utils/ApiError');


exports.createParent = async (req, res, next) => {
 const t = await db.sequelize.transaction();
  try {
    const payload = {
      ...req.body,
      collegeId: req.user.collegeId,
    };

    const result = await parentService.createParent(payload, { transaction: t });
    await t.commit();

    return res.success(result, 'Parent created and credentials sent');
  } catch (err) {
    await t.rollback();
    return next(ApiError.badRequest(err.message));
  }
};

exports.getParents = async (req, res, next) => {
  try {
    // Optional: extract page & limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const list = await parentService.getParents(req.user.collegeId, { page, limit });
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


exports.getStudentsProgress = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const progress = await parentService.getStudentsProgress(parentId);
    res.status(200).json({
      data: progress,
      message: 'Student progress fetched successfully',
      error: null,
      status: true
    });
  } catch (err) {
    next(err);
  }
};


exports.getParentProfile = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const profile = await parentService.getParentProfile(parentId);
    return res.success(profile, "Parent profile fetched");
  } catch (err) {
    return next(err);
  }
};

exports.updateParentProfile = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const updated = await parentService.updateParentProfile(parentId, req.body, req.file);
    return res.success(updated, "Parent profile updated successfully");
  } catch (err) {
    return next(err);
  }
};
