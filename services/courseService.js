// services\courseService.js
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


exports.assignSubject = async (courseId, subjectId) => {
  if (!courseId || !subjectId) throw ApiError.badRequest('courseId and subjectId required');
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findOne({ where: { id: courseId }, transaction: t });
    if (!course) throw ApiError.notFound('Course not found');
    const subject = await db.Subject.findOne({ where: { id: subjectId }, transaction: t });
    if (!subject) throw ApiError.notFound('Subject not found');

    await db.CourseSubjects.upsert({ courseId, subjectId }, { transaction: t });
    await t.commit();

    return await db.Course.findOne({
      where: { id: courseId },
      include: [{ model: db.Subject, as: 'Subjects', through: { attributes: [] } }],
    });
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to assign subject: ${error.message}`);
  }
};


exports.assignSubjectsBulk = async (courseId, subjectIds = []) => {
  if (!courseId || !subjectIds.length) throw ApiError.badRequest('courseId and subjectIds required');
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findByPk(courseId, { transaction: t });
    if (!course) throw ApiError.notFound('Course not found');

    const assignments = subjectIds.map(id => ({ courseId, subjectId: id }));
    await db.CourseSubjects.bulkCreate(assignments, {
      ignoreDuplicates: true,
      transaction: t
    });

    await t.commit();

    return await db.Course.findOne({
      where: { id: courseId },
      include: [{ model: db.Subject, as: 'Subjects', through: { attributes: [] } }]
    });
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to assign subjects: ${error.message}`);
  }
};
