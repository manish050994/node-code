// services/studentService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const csv = require('csv-parser');

exports.createStudent = async ({ payload, creator }) => {
  if (!['collegeadmin'].includes(creator.role)) throw ApiError.forbidden('Not allowed');
  if (!payload.email || !payload.password) throw ApiError.badRequest('Email and password required');
  const t = await db.sequelize.transaction();
  try {
    // Verify college exists
    const college = await db.College.findOne({ where: { id: creator.collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    // Create user first (without studentId)
    const user = await authService.registerStudent({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: payload.password, // Use provided password
      collegeId: creator.collegeId,
    }, { transaction: t });

    // Create student
    const student = await db.Student.create({
      ...payload,
      collegeId: creator.collegeId,
    }, { transaction: t });

    // Link student to user
    await db.User.update({ studentId: student.id }, { where: { id: user.id }, transaction: t });

    await t.commit();
    return { student, user }; // Return hashed password in user object
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create student: ${error.message}`);
  }
};

exports.bulkCreateStudents = (filePath, creator) => {
  if (!['collegeadmin'].includes(creator.role)) throw ApiError.forbidden('Not allowed');
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const t = await db.sequelize.transaction();
        try {
          const students = await Promise.all(results.map(async (row) => {
            if (!row.name || !row.rollNo || !row.email || !row.password) {
              throw ApiError.badRequest('CSV row missing required fields: name, rollNo, email, password');
            }
            return await exports.createStudent({ 
              payload: { 
                ...row, 
                courseId: row.courseId ? parseInt(row.courseId) : null 
              }, 
              creator 
            }, { transaction: t });
          }));
          await t.commit();
          // Clean up the uploaded file
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          resolve({ count: students.length });
        } catch (err) {
          await t.rollback();
          // Clean up file on error
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          reject(ApiError.badRequest(`Failed to bulk create students: ${err.message}`));
        }
      })
      .on('error', (err) => {
        // Clean up file on stream error
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
        reject(ApiError.badRequest(`Failed to read CSV: ${err.message}`));
      });
  });
};

exports.getStudents = async ({ q = {}, collegeId, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const filter = { collegeId };
  if (q.course) filter.courseId = q.course;
  const { rows, count } = await db.Student.findAndCountAll({
    where: filter,
    include: [
      { model: db.Course, as: 'Course' },
      { model: db.Parent, as: 'Parent' },
    ],
    offset,
    limit,
  });
  return { students: rows, total: count, page, limit };
};

exports.getStudent = async ({ id }) => {
  const student = await db.Student.findOne({
    where: { id },
    include: [
      { model: db.Course, as: 'Course' },
      { model: db.Parent, as: 'Parent' },
    ],
  });
  if (!student) throw ApiError.notFound('Student not found');
  return student;
};

exports.updateStudent = async ({ id, payload }) => {
  const t = await db.sequelize.transaction();
  try {
    const student = await db.Student.findOne({ where: { id }, transaction: t });
    if (!student) throw ApiError.notFound('Student not found');
    await student.update(payload, { transaction: t });
    await t.commit();
    return student;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update student: ${error.message}`);
  }
};

exports.deleteStudent = async ({ id }) => {
  const t = await db.sequelize.transaction();
  try {
    const student = await db.Student.findOne({ where: { id }, transaction: t });
    if (!student) throw ApiError.notFound('Student not found');
    await db.User.destroy({ where: { studentId: id }, transaction: t });
    await student.destroy({ transaction: t });
    await t.commit();
    return { message: 'Student and login deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete student: ${error.message}`);
  }
};

exports.getIdCardHtml = async (id) => {
  const student = await db.Student.findOne({ where: { id } });
  if (!student) throw ApiError.notFound('Student not found');
  return `<div>ID Card: ${student.name} - Roll: ${student.rollNo}</div>`;
};