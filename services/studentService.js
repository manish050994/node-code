// services/studentService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const csv = require('csv-parser');
const parentService = require('./parentService');
const bcrypt = require('bcryptjs');
const { generateAndSetLoginId } = require('./userService');

exports.createStudent = async ({ payload, creator }) => {
  const t = await db.sequelize.transaction();
  try {
    // 1️⃣ Validate payload
    const { parent, ...studentData } = payload;
    if (!studentData.name || !studentData.email || !studentData.rollNo || !studentData.courseId) {
      throw ApiError.badRequest('Missing required student fields: name, email, rollNo, courseId');
    }
    if (!creator.collegeId) throw ApiError.badRequest('College ID required');
    if (!parent || !parent.name || !parent.email) {
      throw ApiError.badRequest('Parent details are required with name and email');
    }

    // 2️⃣ Validate course
    const course = await db.Course.findOne({
      where: { id: studentData.courseId, collegeId: creator.collegeId },
      transaction: t,
    });
    if (!course) throw ApiError.badRequest(`Invalid courseId: ${studentData.courseId}`);

    // 3️⃣ Check duplicate (rollNo + collegeId + courseId)
    const existing = await db.Student.findOne({
      where: { rollNo: studentData.rollNo, collegeId: creator.collegeId, courseId: studentData.courseId },
      transaction: t,
    });
    if (existing) {
      throw ApiError.conflict(`Duplicate student with rollNo ${studentData.rollNo} in this course`);
    }

    // 4️⃣ Create student user
    console.log(`Creating user for email: ${studentData.email.toLowerCase()}`); // Debug log
    const studentUser = await authService.registerStudent(
      {
        name: studentData.name,
        email: studentData.email.toLowerCase(),
        password: studentData.password || 'defaultPass123',
        collegeId: creator.collegeId,
      },
      { transaction: t }
    );
    console.log(`Student user created with ID: ${studentUser.id}`); // Debug log

    // 5️⃣ Create student
    console.log(`Creating student with rollNo: ${studentData.rollNo}`); // Debug log
    const student = await db.Student.create(
      {
        name: studentData.name,
        rollNo: studentData.rollNo,
        courseId: studentData.courseId,
        year: studentData.year || null,
        section: studentData.section || null,
        email: studentData.email.toLowerCase(),
        gender: studentData.gender || null,
        motherName: studentData.motherName || null,
        fatherName: studentData.fatherName || null,
        category: studentData.category || null,
        collegeId: creator.collegeId,
        feesPaid: studentData.feesPaid || false,
      },
      { transaction: t }
    );
    console.log(`Student created with ID: ${student.id}`); // Debug log

    // 6️⃣ Update student user with studentId and generate loginId
    console.log(`Updating user ID ${studentUser.id} with studentId: ${student.id}`); // Debug log
    await studentUser.update({ studentId: student.id }, { transaction: t });
    const studentLoginId = await generateAndSetLoginId(studentUser, t);
    console.log(`Student loginId generated: ${studentLoginId}`); // Debug log

    // 7️⃣ Create or reuse parent
    let parentRecord = null;
    if (parent.name && parent.email) {
      console.log(`Processing parent for email: ${parent.email.toLowerCase()}`); // Debug log
      parentRecord = await parentService.createParent(
        {
          name: parent.name,
          email: parent.email.toLowerCase(),
          phone: parent.phone || null,
          password: parent.password || 'defaultPass123',
          studentId: student.id,
          collegeId: creator.collegeId,
          gender: parent.gender || null,
        },
        { transaction: t }
      );
      console.log(`Parent ${parentRecord.parent.id ? 'reused/created' : 'error'} with ID: ${parentRecord.parent.id}`); // Debug log
      await student.update({ parentId: parentRecord.parent.id }, { transaction: t });
    }

    // 8️⃣ Fetch student with associations
    let result;
    try {
      result = await db.Student.findOne({
        where: { id: student.id },
        include: [
          { model: db.Course, as: 'Course' },
          {
            model: db.Parent,
            as: 'Parent',
            include: [{ model: db.User, as: 'User', required: false }],
          },
          { model: db.User, as: 'User', required: false },
        ],
        transaction: t,
      });
      if (!result) throw ApiError.notFound('Student not found after creation');
    } catch (error) {
      console.error('Response query error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        errors: error.errors ? error.errors.map(e => e.message) : null,
      });
      // Fallback query without nested includes
      result = await db.Student.findOne({
        where: { id: student.id },
        include: [
          { model: db.Course, as: 'Course' },
          { model: db.Parent, as: 'Parent' },
          { model: db.User, as: 'User', required: false },
        ],
        transaction: t,
      });
      if (!result) throw ApiError.notFound('Student not found in fallback query');
    }

    await t.commit();
    return result;
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Create student error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors ? error.errors.map(e => e.message) : null,
    });
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
        failedRows.push({ row: index + 1,student: row, reason: 'Missing required fields: name, email, rollNo, courseId' });
        await t.rollback();
        continue;
      }

      // Validate course
      const course = await db.Course.findOne({ where: { id: row.courseId, collegeId }, transaction: t });
      if (!course) {
        failedRows.push({ row: index + 1,student: row, reason: `Invalid courseId: ${row.courseId}` });
        await t.rollback();
        continue;
      }

      // Check duplicate
      const existing = await db.Student.findOne({
        where: { rollNo: row.rollNo, collegeId, courseId: row.courseId },
        transaction: t,
      });
      if (existing) {
        failedRows.push({ row: index + 1, student: row, reason: `Duplicate student with rollNo ${row.rollNo}` });
        await t.rollback();
        continue;
      }

      // Create student user
      const user = await authService.registerStudent(
        {
          name: row.name,
          email: row.email.toLowerCase(),
          password: row.password || 'defaultPass123',
          collegeId,
        },
        { transaction: t }
      );

      // Create student
      const student = await db.Student.create(
        {
          name: row.name,
          rollNo: row.rollNo,
          courseId: row.courseId,
          year: row.year || null,
          section: row.section || null,
          email: row.email.toLowerCase(),
          gender: row.gender || null,
          motherName: row.motherName || null,
          fatherName: row.fatherName || null,
          category: row.category || null,
          collegeId,
          feesPaid: row.feesPaid === 'true' || false,
        },
        { transaction: t }
      );

      // Update user with studentId and generate loginId
      await user.update({ studentId: student.id }, { transaction: t });
      const loginId = await generateAndSetLoginId(user, t);

      // Create/reuse parent if provided
      let parentRecord = null;
      if (row.parentName && row.parentEmail) {
        parentRecord = await parentService.createParent(
          {
            name: row.parentName,
            email: row.parentEmail.toLowerCase(),
            phone: row.parentPhone || null,
            password: row.parentPassword || 'defaultPass123',
            studentId: student.id,
            collegeId,
            gender: row.parentGender || null,
          },
          { transaction: t }
        );
        await student.update({ parentId: parentRecord.parent.id }, { transaction: t });
      }

      // Fetch student with associations
      const newStudent = await db.Student.findOne({
        where: { id: student.id },
        include: [
          { model: db.Course, as: 'Course' },
          { model: db.Parent, as: 'Parent', include: [{ model: db.User, as: 'User' }] },
          { model: db.User, as: 'User' },
        ],
        transaction: t,
      });

      created.push({ row: index + 1, student: newStudent, loginId });
      await t.commit();
    } catch (err) {
      if (!t.finished) await t.rollback();
      failedRows.push({ row: index + 1,student: row, reason: err.message });
    }
  }

  // Clean up file
  fs.unlink(filePath, (err) => {
    if (err) console.error('Failed to delete temp file:', err);
  });

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