const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/email');

const generateTempPassword = () => Math.random().toString(36).slice(-8);

exports.createParent = async (payload, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const student = await db.Student.findOne({ where: { id: payload.studentId }, transaction: t });
    if (!student) throw ApiError.notFound('Student not found');
    const parent = await db.Parent.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      studentId: payload.studentId,
      collegeId,
      createdAt: new Date(),
    }, { transaction: t });
    const tempPassword = generateTempPassword();
    const user = await authService.registerParent({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: tempPassword,
      collegeId,
      studentId: payload.studentId,
    }, { transaction: t });
    await db.Student.update({ parentId: parent.id }, { where: { id: payload.studentId }, transaction: t });
    await sendEmail({
      to: payload.email,
      subject: 'Your Parent Portal Login',
      text: `Email: ${payload.email}\nLogin ID: ${user.loginId}\nPassword: ${tempPassword}`,
    });
    await t.commit();
    return { parent, user };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create parent: ${error.message}`);
  }
};

exports.getParents = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Parent.findAndCountAll({
    where: { collegeId },
    include: [{ model: db.Student, as: 'Student' }],
    offset,
    limit,
  });
  return { parents: rows, total: count, page, limit };
};

exports.updateParent = async (id, payload) => {
  const t = await db.sequelize.transaction();
  try {
    const parent = await db.Parent.findOne({ where: { id }, transaction: t });
    if (!parent) throw ApiError.notFound('Parent not found');
    await parent.update(payload, { transaction: t });
    await t.commit();
    return parent;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update parent: ${error.message}`);
  }
};

exports.deleteParent = async (id) => {
  const t = await db.sequelize.transaction();
  try {
    const parent = await db.Parent.findOne({ where: { id }, transaction: t });
    if (!parent) throw ApiError.notFound('Parent not found');
    await db.User.destroy({ where: { studentId: parent.studentId, role: 'parent' }, transaction: t });
    await db.Student.update({ parentId: null }, { where: { id: parent.studentId }, transaction: t });
    await parent.destroy({ transaction: t });
    await t.commit();
    return { message: 'Parent deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete parent: ${error.message}`);
  }
};