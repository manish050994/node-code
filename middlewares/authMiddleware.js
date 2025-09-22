// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader); // Debug: Log header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token); // Debug: Log token

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('Decoded JWT:', decoded); // Debug: Log decoded payload

    // Fetch user from DB using Sequelize
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: db.College, as: 'College' }],
    });

    console.log('User:', user ? user.toJSON() : null); // Debug: Log user

    if (!user) {
      return next(ApiError.unauthorized('Invalid user'));
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Token Error:', err.message); // Debug: Log error
    return next(ApiError.unauthorized(`Token invalid: ${err.message}`));
  }
};

exports.authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden(`User role ${req.user.role} is not authorized`));
  }
  next();
};

exports.superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (req.user.role !== 'superadmin') {
    return next(ApiError.forbidden('Superadmin only'));
  }
  next();
};

exports.featureAuthorize = (feature) => {
  return async (req, res, next) => {
    console.log('featureAuthorize - req.user:', req.user ? req.user.toJSON() : null); // Debug: Log req.user
    if (!req.user || !req.user.collegeId) {
      return next(ApiError.unauthorized('User or college not authenticated'));
    }
    try {
      const college = await db.College.findOne({ where: { id: req.user.collegeId } });
      console.log('College:', college ? college.toJSON() : null); // Debug: Log college
      if (!college) {
        return next(ApiError.notFound('College not found'));
      }
      if (!college.features[feature]) {
        return next(ApiError.forbidden(`Feature ${feature} is disabled for this college`));
      }
      next();
    } catch (err) {
      console.error('Feature Auth Error:', err.message); // Debug: Log error
      return next(ApiError.badRequest(`Feature authorization failed: ${err.message}`));
    }
  };
};