// services\collegeService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');



exports.addCollege = async (req,{ name, code, address, admin, actor, signatureFile, stampFile }) => {
  if (!name || !code || !admin || !admin.name || !admin.email || !admin.password) {
    throw ApiError.badRequest('name, code, and admin details (name, email, password) required');
  }
  const HOST = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;
  const t = await db.sequelize.transaction();
  try {
    const existingCollege = await db.College.findOne({ where: { code }, transaction: t });
    if (existingCollege) throw ApiError.conflict('College code already exists');

    const college = await db.College.create({
      name,
      code,
      ...address, // spread address fields
      signature: signatureFile ? `collegeProfile/signature/${signatureFile}` : null,
      stamp: stampFile ? `collegeProfile/stamp/${stampFile}` : null,
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
      college,
    }, { transaction: t });

    await db.Log.create({
      actor: actor || 'system',
      action: 'Added college and admin',
      target: `${college.name} (Admin: ${admin.email})`,
      collegeId: college.id,
      at: new Date(),
    }, { transaction: t });

    await t.commit();

    return {
      college: {
        ...college.toJSON(),
        signatureUrl: college.signature ? `${HOST}/${college.signature}` : null,
        stampUrl: college.stamp ? `${HOST}/${college.stamp}` : null,
      },
      user
    };

  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create college: ${err.message}`);
  }
};

exports.updateCollege = async (req,{ id, updates, signatureFile, stampFile }) => {
    const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findOne({ where: { id }, transaction: t });
    if (!college) throw ApiError.notFound('College not found');
    const HOST = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;

    if (signatureFile) updates.signature = `collegeProfile/signature/${signatureFile}`;
    if (stampFile) updates.stamp = `collegeProfile/stamp/${stampFile}`;

    await college.update(updates, { transaction: t });
    await t.commit();

    return {
      ...college.toJSON(),
      signatureUrl: college.signature ? `${HOST}/${college.signature}` : null,
      stampUrl: college.stamp ? `${HOST}/${college.stamp}` : null,
    };
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
      email: admin ? admin.email : college.email ,
      signature: college.signature,
      stamp: college.stamp,
      status: college.status,
      createdAt: college.createdAt,
      updatedAt: college.updatedAt,
      features: college.features,
      loginId: admin ? admin.loginId : null,
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
  if (!id) throw ApiError.badRequest('Invalid college ID');

  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findByPk(id, { transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    // ✅ Delete all users associated with this college
    await db.User.destroy({
      where: { collegeId: id },
      transaction: t,
    });

    // ✅ Delete the college itself
    await db.College.destroy({
      where: { id },
      transaction: t,
    });

    await t.commit();

    return { id, deletedBy: actor };
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete college: ${err.message}`);
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

exports.getCollegeProfile = async (req, { collegeId }) => {
  const HOST = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;
  const college = await db.College.findOne({
    where: { id: collegeId },
    include: [
      {
        model: db.User,
        where: { role: 'collegeadmin' },
        attributes: ['loginId', 'name', 'email'],
        required: false,
      },
    ],
  });

  if (!college) throw ApiError.notFound('College not found');

  const admin = college.Users && college.Users.length > 0 ? college.Users[0] : null;

  return {
    id: college.id,
    name: college.name,
    code: college.code,
    street: college.street,
    city: college.city,
    state: college.state,
    country: college.country,
    pincode: college.pincode,
    contactNo: college.contactNo,
    email: admin ? admin.email : college.email,
    signatureUrl: college.signature ? `${HOST}/${college.signature}` : null,
    stampUrl: college.stamp ? `${HOST}/${college.stamp}` : null,
    features: college.features,
    status: college.status,
    adminName: admin ? admin.name : null,
    loginId: admin ? admin.loginId : null,
    createdAt: college.createdAt,
    updatedAt: college.updatedAt,
  };
};


exports.updateCollegeProfile = async (req, { collegeId, updates, signatureFile, stampFile }) => {
  const t = await db.sequelize.transaction();
  try {
    const college = await db.College.findByPk(collegeId, { transaction: t });
    if (!college) throw ApiError.notFound('College not found');

    const HOST = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;

    if (signatureFile) updates.signature = `collegeProfile/signature/${signatureFile}`;
    if (stampFile) updates.stamp = `collegeProfile/stamp/${stampFile}`;

    await college.update(updates, { transaction: t });
    await t.commit();

    return {
      ...college.toJSON(),
      signatureUrl: college.signature ? `${HOST}/${college.signature}` : null,
      stampUrl: college.stamp ? `${HOST}/${college.stamp}` : null,
    };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update college profile: ${error.message}`);
  }
};

