// services\parentService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');

// services/parentService.js
exports.createParent = async (parentData, options = {}) => {
  const { transaction } = options;
  try {
    const { name, email, phone, password, loginId, studentId, collegeId } = parentData;

    if (!email || !collegeId) {
      throw ApiError.badRequest('Missing required parent fields: email or collegeId');
    }

    // Find parent by email in same college
    let parentUser = await db.User.findOne({
      where: { email, role: 'parent', collegeId },
      include: [{ model: db.Parent, as: 'Parent' }],
      transaction,
    });

    let parent;
    if (parentUser && parentUser.Parent) {
      parent = parentUser.Parent; // reuse existing parent
    } else {
      parent = await db.Parent.create(
        { name, email, phone: phone || null, collegeId, studentId }, 
        { transaction }
      );

      const hashedPassword = await bcrypt.hash(password || 'defaultPass123', 10);
      parentUser = await db.User.create(
        {
          loginId: loginId || (email.split('@')[0] + '_parent'),
          name,
          email,
          password: hashedPassword,
          role: 'parent',
          collegeId,
          parentId: parent.id,
        },
        { transaction }
      );
    }

    // Always link student to parent
    if (studentId) {
      const student = await db.Student.findByPk(studentId, { transaction });
      if (!student) throw ApiError.badRequest(`Student with ID ${studentId} not found`);
      await student.update({ parentId: parent.id }, { transaction });
    }

    return { parent, user: parentUser };
  } catch (error) {
    throw ApiError.badRequest(`Failed to create/link parent: ${error.message}`);
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