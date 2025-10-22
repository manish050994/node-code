// services\collegeService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');

exports.addCollege = async ({ name, code, address, admin, actor }) => {
  if (!name || !code || !admin || !admin.name || !admin.email || !admin.password) {
    throw ApiError.badRequest('name, code, and admin details (name, email, password) required');
  }
  const t = await db.sequelize.transaction();
  try {
    const existingCollege = await db.College.findOne({ where: { code }, transaction: t });
    if (existingCollege) throw ApiError.conflict('College code already exists');
    const college = await db.College.create({
      name,
      code,
      address,
      status: true,
      features: {
        attendance: true,
        studentManagement: true,
        teacherManagement: true,
        courseManagement: true,
        feeManagement: true,
        parent: true,
        notification: true,
        leave: true,
        report: true,
        assignment: true,
        assessment: true,
        timetable: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { transaction: t });
    const user = await authService.registerCollegeAdmin({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      collegeId: college.id,
      college, // Pass the college object to avoid re-query
    }, { transaction: t });
    await db.Log.create({
      actor: actor || 'system',
      action: 'Added college and admin',
      target: `${college.name} (Admin: ${admin.email})`,
      collegeId: college.id,
      at: new Date(),
    }, { transaction: t });
    await t.commit();
    return { college, user };
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create college: ${err.message}`);
  }
};

exports.updateCollege = async ({ id, updates }) => {
  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    await college.update(updates, { transaction: t });
    await t.commit();
    return college;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update college: ${error.message}`);
  }
};

exports.toggleCollege = async ({ id, actor }) => {
  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    await college.update({ status: !college.status }, { transaction: t });
    await db.Log.create({
      actor: actor || 'system',
      action: college.status ? 'Enabled college' : 'Disabled college',
      target: college.name,
      collegeId: college.id,
      at: new Date(),
    }, { transaction: t });
    await t.commit();
    return college;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to toggle college: ${error.message}`);
  }
};

exports.listColleges = async ({ page = 1, limit = 10 } = {}) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  if (isNaN(parsedPage) || parsedPage < 1) throw ApiError.badRequest('Page must be a positive integer');
  if (isNaN(parsedLimit) || parsedLimit < 1) throw ApiError.badRequest('Limit must be a positive integer');

  const offset = (parsedPage - 1) * parsedLimit;

  const { rows, count } = await db.College.findAndCountAll({
    offset,
    limit: parsedLimit,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: db.User,
        where: { role: 'collegeadmin' },
        attributes: ['loginId', 'email', 'name'],
        required: false,
      },
    ],
  });

  const formattedColleges = rows.map(college => {
    const admin = college.Users && college.Users.length > 0 ? college.Users[0] : null;

    // ✅ Combine address fields safely
    const addressParts = [
      college.street,
      college.city,
      college.state,
      college.country,
      college.pincode ? `- ${college.pincode}` : null,
    ].filter(Boolean); // remove null/undefined values

    const address = addressParts.join(', ');

    return {
      id: college.id,
      name: college.name,
      code: college.code,
      shortName: college.shortName,
      type: college.type,
      address: address || null, // ✅ single address field
      contactNo: college.contactNo,
      email: college.email,
      signature: college.signature,
      stamp: college.stamp,
      status: college.status,
      createdAt: college.createdAt,
      updatedAt: college.updatedAt,
      features: college.features,
      adminLoginId: admin ? admin.loginId : null,
      adminEmail: admin ? admin.email : null,
      adminName: admin ? admin.name : null,
    };
  });

  return {
    colleges: formattedColleges,
    total: count,
    page: parsedPage,
    limit: parsedLimit,
  };
};


exports.deleteCollege = async ({ id, actor }) => {
  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    await college.destroy({ transaction: t });
    await db.Log.create({
      actor: actor || 'system',
      action: 'Deleted college',
      target: college.name,
      collegeId: college.id,
      at: new Date(),
    }, { transaction: t });
    await t.commit();
    return { message: 'College deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete college: ${error.message}`);
  }
};

exports.toggleFeature = async ({ id, feature }) => {
  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    const features = { ...(college.features || {}) }; // safe clone

    if (!Object.prototype.hasOwnProperty.call(features, feature)) {
      throw ApiError.badRequest(`Invalid feature: ${feature}`);
    }

    // toggle
    features[feature] = !features[feature];

    // persist
    await college.update({ features }, { transaction: t });
    await t.commit();

    return college;
  } catch (error) {
    await t.rollback();
    // preserve original error type if possible
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(`Failed to toggle feature: ${error.message}`);
  }
};
