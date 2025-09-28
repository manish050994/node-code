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
    throw new ApiError(500, `Failed to create timetable: ${error.message}`);
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
    where.section = student.section;
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

  let header = null;
  if (rows.length > 0) {
    const { validFrom, validTo } = rows[0];
    const fromDate = validFrom ? new Date(validFrom).toISOString().split('T')[0] : 'N/A';
    const toDate = validTo ? new Date(validTo).toISOString().split('T')[0] : 'Ongoing';
    header = `Valid from ${fromDate} till ${toDate}`;
  }

  return {
    header,
    timetable: rows,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
  };
};

exports.getUpcomingClass = async ({ user }) => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let todayIndex = new Date().getDay();
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
    } else if (user.role === 'student') {
      const student = await db.Student.findByPk(user.studentId);
      if (!student) throw new ApiError(404, 'Student not found');
      where.courseId = student.courseId;
      where.section = student.section;
    }

    if (i === 0) {
      where.time = { [Op.gt]: now };
    }

    const nextClass = await db.Timetable.findOne({
      where,
      include: [
        { model: db.Subject, attributes: ['id', 'name', 'code'] },
        { model: db.Teacher, attributes: ['id', 'name', 'employeeId'] },
        { model: db.Course, attributes: ['id', 'name'] }
      ],
      order: [['time', 'ASC']]
    });

    if (nextClass) {
      return nextClass;
    }
  }

  return null;
};

exports.getClassesByClassTeacher = async (teacherId, collegeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const courseTeachers = await db.CourseTeachers.findAll({
    where: { teacherId },
    attributes: ['courseId']
  });

  const courseIds = courseTeachers.map(ct => ct.courseId);

  if (!courseIds.length) {
    return { timetable: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const where = {
    collegeId,
    courseId: { [Op.in]: courseIds },
    [Op.and]: [
      { validFrom: { [Op.lte]: new Date() } },
      { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
    ]
  };

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

exports.getClassesBySubjectTeacher = async (teacherId, collegeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const where = {
    collegeId,
    teacherId,
    [Op.and]: [
      { validFrom: { [Op.lte]: new Date() } },
      { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
    ]
  };

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

exports.getSubjectsWithClasses = async (teacherId, collegeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const teacherSubjects = await db.TeacherSubjects.findAll({
    where: { teacherId },
    attributes: ['subjectId']
  });

  const subjectIds = teacherSubjects.map(ts => ts.subjectId);

  if (!subjectIds.length) {
    return { subjects: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const { count, rows } = await db.Subject.findAndCountAll({
    where: { id: { [Op.in]: subjectIds }, collegeId },
    include: [
      {
        model: db.Timetable,
        as: 'Timetables',
        attributes: ['id', 'day', 'time', 'courseId', 'section', 'validFrom', 'validTo'],
        include: [
          { model: db.Course, attributes: ['id', 'name'] }
        ],
        where: {
          [Op.and]: [
            { validFrom: { [Op.lte]: new Date() } },
            { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
          ]
        }
      }
    ],
    limit,
    offset
  });

  return {
    subjects: rows,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
  };
};

exports.exportCsv = async () => {
  const fields = ['day', 'time', 'subjectId', 'teacherId', 'courseId', 'section', 'validFrom', 'validTo'];
  const parser = new Parser({ fields });
  const sample = [
    { day: 'Monday', time: '09:00', subjectId: 1, teacherId: 3, courseId: 1, section: 'A', validFrom: '2025-01-01', validTo: '2025-12-31' }
  ];
  return parser.parse(sample);
};

exports.importCsv = async (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', row => {
        if (!row.day || !row.time || !row.subjectId || !row.teacherId || !row.courseId) {
          throw new ApiError(400, 'CSV row missing required fields: day, time, subjectId, teacherId, courseId');
        }
        results.push({ ...row, collegeId });
      })
      .on('end', async () => {
        const t = await db.sequelize.transaction();
        try {
          const timetables = await db.Timetable.bulkCreate(results, { transaction });
          await t.commit();
          fs.unlink(filePath, err => { if (err) console.error('Failed to delete temp file:', err); });
          resolve(timetables);
        } catch (err) {
          await t.rollback();
          fs.unlink(filePath, err => { if (err) console.error('Failed to delete temp file:', err); });
          reject(new ApiError(400, `Failed to import timetable: ${err.message}`));
        }
      })
      .on('error', err => {
        fs.unlink(filePath, err => { if (err) console.error('Failed to delete temp file:', err); });
        reject(new ApiError(400, `Failed to read CSV: ${err.message}`));
      });
  });
};