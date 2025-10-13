// services\subjectService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.createSubject = async (payload, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const subject = await db.Subject.create({
      ...payload,
      collegeId,
    }, { transaction: t });
    await t.commit();
    return subject;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create subject: ${error.message}`);
  }
};

exports.getSubjects = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Subject.findAndCountAll({
    where: { collegeId },
    include: [{ model: db.Teacher, as: 'Teacher' }],
    offset,
    limit,
  });
  return { subjects: rows, total: count, page, limit };
};

exports.updateSubject = async ({ id, payload }) => {
  const t = await db.sequelize.transaction();
  try {
    const subject = await db.Subject.findOne({ where: { id }, transaction: t });
    if (!subject) throw ApiError.notFound('Subject not found');
    await subject.update(payload, { transaction: t });
    await t.commit();
    return subject;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update subject: ${error.message}`);
  }
};

exports.deleteSubject = async ({ id }) => {
  const t = await db.sequelize.transaction();
  try {
    const subject = await db.Subject.findOne({ where: { id }, transaction: t });
    if (!subject) throw ApiError.notFound('Subject not found');
    await subject.destroy({ transaction: t });
    await t.commit();
    return { message: 'Subject deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete subject: ${error.message}`);
  }
};

exports.getSubjectsByCourse = async (courseId, collegeId) => {
  if (!courseId) throw ApiError.badRequest('courseId is required');

  const course = await db.Course.findOne({
    where: { id: courseId, collegeId },
    include: [
      {
        model: db.Subject,
        as: 'Subjects',
        through: { attributes: [] },
        include: [
          { model: db.Teacher, as: 'Teacher', attributes: ['id', 'name'] }
        ]
      }
    ]
  });

  if (!course) throw ApiError.notFound('Course not found');

  return {
    courseId: course.id,
    courseName: course.name,
    subjects: course.Subjects || []
  };
};