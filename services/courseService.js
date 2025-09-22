const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.createCourse = async (payload, collegeId) => {
  if (!payload || !payload.name) throw ApiError.badRequest('Course name required');
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.create({
      ...payload,
      collegeId,
    }, { transaction: t });
    await t.commit();
    return course;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create course: ${error.message}`);
  }
};

exports.getCourses = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Course.findAndCountAll({
    where: { collegeId },
    include: [
      { model: db.Subject, as: 'Subjects', through: { attributes: [] } },
      { model: db.Teacher, as: 'Teachers', through: { attributes: [] } },
    ],
    offset,
    limit,
  });
  return { courses: rows, total: count, page, limit };
};

exports.updateCourse = async ({ id, payload }) => {
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findOne({ where: { id }, transaction: t });
    if (!course) throw ApiError.notFound('Course not found');
    await course.update(payload, { transaction: t });
    await t.commit();
    return course;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update course: ${error.message}`);
  }
};

exports.deleteCourse = async ({ id }) => {
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findOne({ where: { id }, transaction: t });
    if (!course) throw ApiError.notFound('Course not found');
    await course.destroy({ transaction: t });
    await t.commit();
    return { message: 'Course deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete course: ${error.message}`);
  }
};