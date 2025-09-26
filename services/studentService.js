// services/studentService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const csv = require('csv-parser');
const parentService = require('./parentService');
const bcrypt = require('bcryptjs');
const { parseCsv } = require('../utils/csvParser');
const { generateLoginId } = require('./userService');


exports.createStudent = async ({ payload, creator }) => {
  const t = await db.sequelize.transaction();
  try {
    const { parent, ...studentData } = payload;
    if (!creator.collegeId) throw ApiError.badRequest('College ID required');

    if (!studentData.email || !studentData.name || !studentData.rollNo || !studentData.courseId) {
      throw ApiError.badRequest('Missing required student fields');
    }

    // 🔹 Check duplicate (rollNo + collegeId OR email + collegeId)
    const existing = await db.Student.findOne({
      where: { rollNo: studentData.rollNo, collegeId: creator.collegeId },
      transaction: t,
    });
    if (existing) {
      throw ApiError.badRequest(`Duplicate student with rollNo ${studentData.rollNo} in this college`);
    }

    const course = await db.Course.findOne({
      where: { id: studentData.courseId, collegeId: creator.collegeId },
      transaction: t,
    });
    if (!course) {
      throw ApiError.badRequest(`Invalid courseId: ${studentData.courseId}`);
    }

    const studentLoginId = await generateLoginId(studentData.rollNo || studentData.name);
    const parentLoginId = await generateLoginId(`${studentLoginId}p`);

    const student = await db.Student.create(
      { ...studentData, collegeId: creator.collegeId },
      { transaction: t }
    );

    const hashedPassword = await bcrypt.hash(studentData.password || 'defaultPass123', 10);
    await db.User.create(
      {
        loginId: studentLoginId,
        name: studentData.name,
        email: studentData.email,
        password: hashedPassword,
        role: 'student',
        collegeId: creator.collegeId,
        studentId: student.id,
      },
      { transaction: t }
    );

    if (parent && parent.name && parent.email) {
      await parentService.createParent(
        {
          name: parent.name,
          email: parent.email,
          phone: parent.phone || null,
          password: parent.password || 'defaultPass123',
          loginId: parentLoginId,
          studentId: student.id,
          collegeId: creator.collegeId,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return await db.Student.findOne({
      where: { id: student.id },
      include: [
        { model: db.Course, as: 'Course' },
        { model: db.Parent, as: 'Parent' },
        { model: db.User, as: 'User' },
      ],
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    throw ApiError.badRequest(`Failed to create student: ${error.message}`);
  }
};

exports.bulkCreateStudents = async (filePath, collegeId) => {
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
      if (!row.name || !row.email || !row.rollNo || !row.courseId) {
        failedRows.push({ row: index + 1, reason: 'Missing required student fields' });
        await t.rollback();
        continue;
      }

      // 🔹 Duplicate check
      const existing = await db.Student.findOne({
        where: { rollNo: row.rollNo, collegeId },
        transaction: t,
      });
      if (existing) {
        failedRows.push({ row: index + 1, reason: `Duplicate student with rollNo ${row.rollNo}` });
        await t.rollback();
        continue;
      }

      // Validate course
      const course = await db.Course.findOne({ where: { id: row.courseId, collegeId }, transaction: t });
      if (!course) {
        failedRows.push({ row: index + 1, reason: `Invalid courseId: ${row.courseId}` });
        await t.rollback();
        continue;
      }

      const studentLoginId = await generateLoginId(row.rollNo || row.name);
      const parentLoginId = await generateLoginId(`${studentLoginId}p`);

      const student = await db.Student.create(
        {
          name: row.name,
          rollNo: row.rollNo,
          courseId: row.courseId,
          year: row.year || null,
          section: row.section || null,
          email: row.email,
          collegeId,
        },
        { transaction: t }
      );

      const hashedPassword = await bcrypt.hash(row.password || 'defaultPass123', 10);
      await db.User.create(
        {
          loginId: studentLoginId,
          name: row.name,
          email: row.email,
          password: hashedPassword,
          role: 'student',
          collegeId,
          studentId: student.id,
        },
        { transaction: t }
      );

      if (row.parentName && row.parentEmail) {
        await parentService.createParent(
          {
            name: row.parentName,
            email: row.parentEmail,
            phone: row.parentPhone || null,
            password: row.parentPassword || 'defaultPass123',
            loginId: parentLoginId,
            studentId: student.id,
            collegeId,
          },
          { transaction: t }
        );
      }

      const newStudent = await db.Student.findOne({
        where: { id: student.id },
        include: [
          { model: db.Course, as: 'Course' },
          { model: db.Parent, as: 'Parent' },
          { model: db.User, as: 'User' },
        ],
        transaction: t,
      });

      created.push(newStudent);
      await t.commit();
    } catch (err) {
      if (!t.finished) await t.rollback();
      failedRows.push({ row: index + 1, reason: err.message });
    }
  }

  return { created, failedRows, createdCount: created.length, failedCount: failedRows.length };
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
  const student = await db.Student.findOne({ 
    where: { id },
    include: [{ model: db.Course, as: 'Course' }]
  });
  if (!student) throw ApiError.notFound('Student not found');
  return `Name: ${student.name}\nRoll No: ${student.rollNo}\nCourse: ${student.Course.name}\nCollege ID: ${student.collegeId}`;
};