const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

exports.registerSuperAdmin = async ({ name, email, password, role }) => {
  if (!name || !email || !password) throw ApiError.badRequest('name, email, and password required');
  const t = await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      loginId: uuidv4(),
      name,
      email,
      password: hashed,
      role: role || 'superadmin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return { id: user.id, email: user.email, loginId: user.loginId };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to register superadmin: ${error.message}`);
  }
};

exports.registerCollegeAdmin = async ({ name, email, password, collegeId, college }, options = {}) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = options.transaction || await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    // Use passed college object if available, otherwise query
    const collegeRecord = college || await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!collegeRecord) throw ApiError.notFound('College not found');
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      loginId: uuidv4(),
      name,
      email,
      password: hashed,
      role: 'collegeadmin',
      collegeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    if (!options.transaction) await t.commit();
    return { id: user.id, loginId: user.loginId, email: user.email };
  } catch (err) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to register college admin: ${err.message}`);
  }
};

exports.registerTeacher = async ({ name, email, password, collegeId, teacherId }) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      loginId: uuidv4(),
      name,
      email,
      password: hashed,
      role: 'teacher',
      collegeId,
      teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return { id: user.id, email: user.email, loginId: user.loginId };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to register teacher: ${error.message}`);
  }
};

exports.registerStudent = async ({ name, email, password, collegeId, studentId }) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      loginId: uuidv4(),
      name,
      email,
      password: hashed,
      role: 'student',
      collegeId,
      studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return { id: user.id, email: user.email, loginId: user.loginId };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to register student: ${error.message}`);
  }
};

exports.registerParent = async ({ name, email, password, collegeId, studentId }) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      loginId: uuidv4(),
      name,
      email,
      password: hashed,
      role: 'parent',
      collegeId,
      studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return { id: user.id, email: user.email, loginId: user.loginId };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to register parent: ${error.message}`);
  }
};

exports.login = async ({ email, password, collegeCode }) => {
  
  if (!email || !password) throw ApiError.badRequest('email and password required');
  const user = await db.User.findOne({
    where: { email },
    include: [{ model: db.College, as: 'College' }],
  });
  if (!user) throw ApiError.notFound('User not found');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Invalid credentials');
  if (user.role === 'collegeadmin' && user.College && user.College.code !== collegeCode) {
    throw ApiError.forbidden('Invalid college code');
  }
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign({ id: user.id, temp: true }, config.jwtSecret, { expiresIn: '5m' });
    return { require2FA: true, tempToken };
  }
  const tokenPayload = { id: user.id, role: user.role, collegeId: user.collegeId || null, loginId: user.loginId };
  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { token, user: { id: user.id, name: user.name, role: user.role, loginId: user.loginId, collegeId: user.collegeId } };
};

exports.forgotPassword = async (email) => {
  const user = await db.User.findOne({ where: { email } });
  if (!user) throw ApiError.notFound('User not found');
  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  await user.update({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000),
  });
  const resetUrl = `http://yourapp.com/reset/${resetToken}`;
  await sendEmail({ to: user.email, subject: 'Password Reset', text: resetUrl });
};

exports.resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await db.User.findOne({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { [db.Sequelize.Op.gt]: new Date() },
    },
  });
  if (!user) throw ApiError.badRequest('Invalid token');
  const hashed = await bcrypt.hash(password, 10);
  await user.update({
    password: hashed,
    resetPasswordToken: null,
    resetPasswordExpire: null,
  });
};

exports.enable2FA = async (userId) => {
  const user = await db.User.findOne({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  const secret = speakeasy.generateSecret({ length: 20 });
  await user.update({
    twoFactorSecret: secret.base32,
    twoFactorEnabled: true,
  });
  return secret.otpauth_url;
};

exports.verify2FA = async (tempToken, otp) => {
  const decoded = jwt.verify(tempToken, config.jwtSecret);
  const user = await db.User.findOne({ where: { id: decoded.id } });
  const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: otp });
  if (!verified) throw ApiError.unauthorized('Invalid OTP');
  const token = jwt.sign(
    { id: user.id, role: user.role, collegeId: user.collegeId, loginId: user.loginId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  return { token, user: { id: user.id, name: user.name, role: user.role, loginId: user.loginId } };
};

exports.disable2FA = async (userId) => {
  const user = await db.User.findOne({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (!user.twoFactorEnabled) throw ApiError.badRequest('2FA is not enabled for this account');
  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
  });
  return { message: '2FA has been disabled successfully' };
};