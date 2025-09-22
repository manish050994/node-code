const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');

exports.createTeacher = async (payload, collegeId) => {
  if (!payload.name || !payload.employeeId || !payload.email || !payload.password) {
    throw ApiError.badRequest('name, employeeId, email, and password required');
  }
  const t = await db.sequelize.transaction();
  try {
    // Verify college exists
    const college = await db.College.findOne({ where: { id: collegeId }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    // Create user first (without teacherId)
    const user = await authService.registerTeacher({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: payload.password, // Use provided password (hashed in authService)
      collegeId,
    }, { transaction: t });

    // Create teacher
    const teacher = await db.Teacher.create({
      ...payload,
      collegeId,
    }, { transaction: t });

    // Link teacher to user
    await db.User.update({ teacherId: teacher.id }, { where: { id: user.id }, transaction: t });

    await t.commit();
    return { teacher, user }; // Return both (password is hashed in user)
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create teacher: ${error.message}`);
  }
};

exports.bulkCreateTeachers = async (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const t = await db.sequelize.transaction();
        try {
          const teachers = await Promise.all(results.map(async (row) => {
            if (!row.name || !row.employeeId || !row.email || !row.password) {
              throw ApiError.badRequest('CSV row missing required fields: name, employeeId, email, password');
            }
            return await exports.createTeacher(row, collegeId, { transaction: t });
          }));
          await t.commit();
          // Clean up the uploaded file
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          resolve({ count: teachers.length });
        } catch (err) {
          await t.rollback();
          // Clean up file on error
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          reject(ApiError.badRequest(`Failed to bulk create teachers: ${err.message}`));
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

exports.getTeachers = async (options = {}) => {
  const { collegeId, page = 1, limit = 10 } = options;
  if (!collegeId) throw ApiError.badRequest('collegeId required');
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Teacher.findAndCountAll({
    where: { collegeId },
    include: [{
      model: db.Subject,
      as: 'Subjects', // Ensure alias matches association
      through: { attributes: [] }, // Exclude junction table attributes
    }],
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