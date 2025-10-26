// controllers\collegeController.js (modified: added toggleFeature)
const collegeService = require('../services/collegeService');

exports.addCollege = async (req, res, next) => {
  try {
    const { name, code, street, city, state, country, pincode, adminName, adminEmail, adminPassword } = req.body;
    const signatureFile = req.files?.signature ? req.files.signature[0].filename : null;
    const stampFile = req.files?.stamp ? req.files.stamp[0].filename : null;

    const payload = {
      name,
      code,
      address: { street, city, state, country, pincode },
      admin: { name: adminName, email: adminEmail, password: adminPassword },
      actor: req.user ? req.user.loginId : 'system',
      signatureFile,
      stampFile,
    };

    const result = await collegeService.addCollege(req, payload);
    return res.success(result, 'College created successfully');
  } catch (err) {
    return next(err);
  }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const updates = req.body;
    const signatureFile = req.files?.signature ? req.files.signature[0].filename : null;
    const stampFile = req.files?.stamp ? req.files.stamp[0].filename : null;

    const result = await collegeService.updateCollege(req, {
      id: parseInt(req.params.id),
      updates,
      signatureFile,
      stampFile,
    });

    return res.success(result, 'College updated successfully');
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


exports.getCollegeProfile = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) throw ApiError.badRequest('College ID missing in token');

    const profile = await collegeService.getCollegeProfile(req, { collegeId });
    return res.success(profile, 'College profile fetched successfully');
  } catch (err) {
    return next(err);
  }
};

exports.updateCollegeProfile = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) throw ApiError.badRequest('College ID missing in token');

    const updates = req.body;
    const signatureFile = req.files?.signature ? req.files.signature[0].filename : null;
    const stampFile = req.files?.stamp ? req.files.stamp[0].filename : null;

    const updatedProfile = await collegeService.updateCollegeProfile(req, {
      collegeId,
      updates,
      signatureFile,
      stampFile,
    });

    return res.success(updatedProfile, 'College profile updated successfully');
  } catch (err) {
    return next(err);
  }
};