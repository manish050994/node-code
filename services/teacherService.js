// services\teacherService.js
const db = require('../models');
const authService = require('./authService');
const fs = require('fs');
const csv = require('csv-parser');

const ApiError = require('../utils/ApiError');

exports.createTeacher = async (payload, collegeId, options = {}) => {
  if (!payload.name || !payload.employeeId || !payload.email || !payload.password) {
    throw ApiError.badRequest('name, employeeId, email, and password required');
  }
  const t = options.transaction || await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    const existingTeacher = await db.Teacher.findOne({
      where: { employeeId: payload.employeeId, collegeId },
      transaction: t,
    });
    if (existingTeacher) throw ApiError.conflict('Teacher with this employeeId already exists');

    const teacher = await db.Teacher.create({
      name: payload.name,
      employeeId: payload.employeeId,
      email: payload.email,
      gender: payload.gender || null,
      dob: payload.dob ? new Date(payload.dob) : null,
      profilePhoto: payload.profilePhoto || null,
      mobileNo: payload.mobileNo || null,
      category: payload.category || null,
      collegeId,
    }, { transaction: t });

    const user = await authService.registerTeacher({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: payload.password,
      collegeId,
      teacherId: teacher.id,
    }, { transaction: t });

    if (!options.transaction) await t.commit();
    return { teacher, user };
  } catch (error) {
    if (!options.transaction) await t.rollback();
    throw ApiError.badRequest(`Failed to create teacher: ${error.message}`);
  }
};

exports.bulkCreateTeachers = async (filePath, collegeId) => {
  const created = [];
  const failedRows = [];

  const csvData = await new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

  for (const [index, row] of csvData.entries()) {
    const t = await db.sequelize.transaction();
    try {
      if (!row.name || !row.employeeId || !row.email || !row.password) {
        failedRows.push({ row: index + 1, reason: 'Missing required fields: name, employeeId, email, password' });
        await t.rollback();
        continue;
      }

      const result = await exports.createTeacher(row, collegeId, { transaction: t });
      await t.commit();

      // Include loginId from created user
      created.push({
        row: index + 1,
        teacher: result.teacher,
        loginId: result.user.loginId || null,
      });
    } catch (err) {
      if (!t.finished) await t.rollback();
      failedRows.push({ row: index + 1,teacher: row, reason: err.message });
    }
  }

  // Clean up file
  fs.unlink(filePath, (err) => {
    if (err) console.error('Failed to delete temp file:', err);
  });

  return { created, failedRows, createdCount: created.length, failedCount: failedRows.length };
};

exports.getTeachers = async (options = {}) => {
  const { collegeId, page = 1, limit = 10 } = options;
  if (!collegeId) throw ApiError.badRequest('collegeId required');
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Teacher.findAndCountAll({
    where: { collegeId },
    include: [
      {
      model: db.Subject,
      as: 'Subjects', // Ensure alias matches association
      through: { attributes: [] }, // Exclude junction table attributes
      },
      {
        model: db.User,
        as: 'User',
        attributes: ['loginId', 'email', 'name', 'role'],
        required: false, // may not exist for all teachers
      },
  
  ],
    offset,
    limit,
  });
  return { teachers: rows, total: count, page, limit };
};

exports.updateTeacher = async ({ id, payload }) => {
  const t = await db.sequelize.transaction();
  try {
    const teacher = await db.Teacher.findOne({ where: { id }, transaction: t });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    await teacher.update(payload, { transaction: t });
    await t.commit();
    return teacher;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update teacher: ${error.message}`);
  }
};

exports.deleteTeacher = async ({ id }) => {
  const t = await db.sequelize.transaction();
  try {
    const teacher = await db.Teacher.findOne({ where: { id }, transaction: t });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    await db.User.destroy({ where: { teacherId: id }, transaction: t });
    await teacher.destroy({ transaction: t });
    await t.commit();
    return { message: 'Teacher and login deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete teacher: ${error.message}`);
  }
};

exports.assignSubject = async (id, subjectId) => {
  if (!subjectId) throw ApiError.badRequest('subjectId required');
  const t = await db.sequelize.transaction();
  try {
    const teacher = await db.Teacher.findOne({ where: { id }, transaction: t });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    const subject = await db.Subject.findOne({ where: { id: subjectId }, transaction: t });
    if (!subject) throw ApiError.notFound('Subject not found');
    // Assume TeacherSubjects junction model exists; create if not
    await db.TeacherSubjects.upsert({ teacherId: id, subjectId }, { transaction: t });
    await t.commit();
    // Refetch with includes
    return await db.Teacher.findOne({
      where: { id },
      include: [{ model: db.Subject, as: 'Subjects', through: { attributes: [] } }],
    });
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to assign subject: ${error.message}`);
  }
};

exports.assignGroup = async (id, group) => {
  if (!group) throw ApiError.badRequest('group required');
  const t = await db.sequelize.transaction();
  try {
    const teacher = await db.Teacher.findOne({ where: { id }, transaction: t });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    const groups = teacher.groups || [];
    if (!groups.includes(group)) groups.push(group);
    await teacher.update({ groups }, { transaction: t });
    await t.commit();
    return teacher;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to assign group: ${error.message}`);
  }
};


exports.assignCourse = async (id, courseId) => {
  if (!courseId) throw ApiError.badRequest('courseId required');
  const t = await db.sequelize.transaction();
  try {
    const teacher = await db.Teacher.findOne({ where: { id }, transaction: t });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    const course = await db.Course.findOne({ where: { id: courseId }, transaction: t });
    if (!course) throw ApiError.notFound('Course not found');
    await db.CourseTeachers.upsert({ courseId, teacherId: id }, { transaction: t });
    await t.commit();
    return await db.Teacher.findOne({
      where: { id },
      include: [{ model: db.Course, as: 'Courses', through: { attributes: [] } }],
    });
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to assign course: ${error.message}`);
  }
};


