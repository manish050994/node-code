// services/timetableService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const csvParser = require('csv-parser');
const fs = require('fs');
const moment = require('moment');

exports.createTimetable = async (payload, collegeId, transaction = null) => {
  try {
    return await db.Timetable.create({ ...payload, collegeId }, { transaction });
  } catch (error) {
    throw new ApiError(500, 'Failed to create timetable', error);
  }
};

exports.getTimetable = async (user, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const where = {
    collegeId: user.collegeId,
    [Op.and]: [
      { validFrom: { [Op.lte]: new Date() } },
      { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
    ]
  };


  if (user.role === 'teacher') {
    where.teacherId = user.teacherId;
  } else if (user.role === 'student') {
    const student = await db.Student.findByPk(user.studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    where.courseId = student.courseId;
  }

  const { count, rows } = await db.Timetable.findAndCountAll({
    where,
    include: [
      { model: db.Subject, attributes: ['id', 'name', 'code'] },
      { model: db.Teacher, attributes: ['id', 'name', 'employeeId'] },
      { model: db.Course, attributes: ['id', 'name'] }
    ],
    limit,
    offset,
    order: [['day', 'ASC'], ['time', 'ASC']]
  });

  return {
    timetable: rows,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
  };
};


exports.getUpcomingClass = async ({ user }) => {
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  let todayIndex = new Date().getDay(); // 0=Sunday, 1=Monday...
  let now = moment().format('HH:mm');

  for (let i = 0; i < 7; i++) {
    const dayIndex = (todayIndex + i) % 7;
    const dayName = weekdays[dayIndex];

    const where = {
      day: dayName,
      collegeId: user.collegeId,
      [Op.and]: [
        { validFrom: { [Op.lte]: new Date() } },
        { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
      ]
    };

    if (user.role === 'teacher') {
      where.teacherId = user.teacherId;
    }
    if (user.role === 'student') {
      where.courseId = user.courseId;
      where.section = user.section;
    }

    // If checking today, filter only future times
    if (i === 0) {
      where.time = { [Op.gt]: now };
    }

    const nextClass = await db.Timetable.findOne({
      where,
      order: [['time','ASC']]
    });

    if (nextClass) {
      return nextClass;
    }
  }

  return null; // no upcoming class found in the week
};

// CSV Export
exports.exportCsv = async () => {
  const fields = ['day', 'time', 'subjectId', 'teacherId', 'courseId', 'section', 'validFrom', 'validTo'];
  const parser = new Parser({ fields });
  const sample = [
    { day: 'Monday', time: '09:00', subjectId: 1, teacherId: 2, courseId: 3, section: 'A', validFrom: '2025-01-01', validTo: '2025-12-31' }
  ];
  return parser.parse(sample);
};

// CSV Import
exports.importCsv = async (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', row => results.push({ ...row, collegeId }))
      .on('end', async () => {
        try {
          await db.Timetable.bulkCreate(results);
          resolve(results);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
};
