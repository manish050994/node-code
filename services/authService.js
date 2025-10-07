// services\authService.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');
const {generateAndSetLoginId} = require('../services/userService')

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
    await generateAndSetLoginId(user, t);
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
    await generateAndSetLoginId(user, t);
    if (!options.transaction) await t.commit();
    return { id: user.id, loginId: user.loginId, email: user.email };
  } catch (err) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to register college admin: ${err.message}`);
  }
};

exports.registerTeacher = async ({ name, email, password, collegeId, teacherId }, options = {}) => {
  if (!name || !email || !password || !collegeId || !teacherId) {
    throw ApiError.badRequest('name, email, password, collegeId, and teacherId required');
  }
  const t = options.transaction || await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict('User already exists');
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    const hashed = await bcrypt.hash(password, 10);
    console.log(`Creating user with teacherId: ${teacherId}`); // Debug log
    const user = await db.User.create({
      loginId: uuidv4(), // Temporary UUID
      name,
      email,
      password: hashed,
      role: 'teacher',
      collegeId,
      teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    console.log(`User created with ID: ${user.id}, teacherId: ${user.teacherId}`); // Debug log
    const newLoginId = await generateAndSetLoginId(user, t);
    if (!newLoginId) {
      throw ApiError.internal(`Failed to generate loginId for user ID ${user.id}`);
    }
    if (!options.transaction) await t.commit();
    return { id: user.id, email: user.email, loginId: user.loginId };
  } catch (error) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to register teacher: ${error.message}`);
  }
};

exports.registerStudent = async ({ name, email, password, collegeId, studentId = null }, options = {}) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = options.transaction || await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict(`User with email ${email} already exists`);

    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    const hashed = await bcrypt.hash(password, 10);
    console.log(`Creating user for email: ${email}, studentId: ${studentId || 'null'}`); // Debug log
    let user;
    try {
      user = await db.User.create({
        loginId: uuidv4(), // Temporary UUID
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: 'student',
        collegeId,
        studentId, // Null initially or provided
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { transaction: t });
    } catch (err) {
      console.error('User creation failed:', err.name, err.errors?.map(e => e.message)); // Detailed error log
      throw ApiError.badRequest(`User creation failed: ${err.message}`);
    }
    console.log(`User created with ID: ${user.id}`); // Debug log

    if (!options.transaction) await t.commit();
    return user; // Return user for further updates
  } catch (error) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to register student: ${error.message}`);
  }
};

exports.registerParent = async ({ name, email, password, collegeId, parentId = null }, options = {}) => {
  if (!name || !email || !password || !collegeId) {
    throw ApiError.badRequest('name, email, password, and collegeId required');
  }
  const t = options.transaction || await db.sequelize.transaction();
  try {
    const existing = await db.User.findOne({ where: { email }, transaction: t });
    if (existing) throw ApiError.conflict(`User with email ${email} already exists`);

    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    const hashed = await bcrypt.hash(password, 10);
    console.log(`Creating parent user for email: ${email}, parentId: ${parentId || 'null'}`); // Debug log
    let user;
    try {
      user = await db.User.create({
        loginId: uuidv4(), // Temporary UUID
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: 'parent',
        collegeId,
        parentId, // Null initially or provided
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { transaction: t });
    } catch (err) {
      console.error('Parent user creation failed:', err.name, err.errors?.map(e => e.message)); // Detailed error log
      throw ApiError.badRequest(`Parent user creation failed: ${err.message}`);
    }
    console.log(`Parent user created with ID: ${user.id}`); // Debug log

    if (!options.transaction) await t.commit();
    return user; // Return user for further updates
  } catch (error) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to register parent: ${error.message}`);
  }
};

exports.login = async ({ loginId, password }) => {
  
  if (!loginId || !password) throw ApiError.badRequest('email and password required');
  const user = await db.User.findOne({
    where: { loginId },
    include: [{ model: db.College, as: 'College' }],
  });
  if (!user) throw ApiError.notFound('User not found');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Invalid credentials');
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign({ id: user.id, temp: true }, config.jwtSecret, { expiresIn: '5m' });
    return { require2FA: true, tempToken };
  }
  const tokenPayload = { id: user.id, role: user.role, collegeId: user.collegeId || null, loginId: user.loginId };
  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  
  // Prepare user response
  const responseUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    loginId: user.loginId,
    collegeId: user.collegeId,
  };

  // If user is a teacher, fetch their courses
  // Teacher-specific data
  if (user.role === 'teacher') {
    const teacher = await db.Teacher.findOne({
      where: { id: user.teacherId },
      include: [
        {
          model: db.Course,
          through: { attributes: [] }, // exclude CourseTeachers table attrs
        },
        {
          model: db.Subject,
          as: 'Subjects',
          through: { attributes: [] }, // exclude TeacherSubjects table attrs
        },
      ],
    });

    if (teacher) {
      // Assigned courses
      responseUser.courses = teacher.Courses.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        collegeId: course.collegeId,
      }));

      // Assigned subjects
      responseUser.subjects = teacher.Subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        collegeId: subject.collegeId,
      }));

      // Teacher type
      responseUser.teacherType = [];
      if (teacher.Courses.length > 0) {
        responseUser.teacherType.push("class_teacher");
      }
      if (teacher.Subjects.length > 0) {
        responseUser.teacherType.push("subject_teacher");
      }
      if (responseUser.teacherType.length === 0) {
        responseUser.teacherType.push("unassigned");
      }
    } else {
      responseUser.courses = [];
      responseUser.subjects = [];
      responseUser.teacherType = ["unassigned"];
    }
  }


  return { token, user: responseUser };
};

exports.forgotPassword = async (loginId) => {
  const user = await db.User.findOne({ where: { loginId } });
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