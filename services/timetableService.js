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

  const { count, rows } = await db.CourseTeachers.findAndCountAll({
    where: { teacherId },
    include: [
      {
        model: db.Course,
        where: { collegeId },
        attributes: ['id', 'code', 'name'],
        include: [
          {
            model: db.CourseSubjects,
            include: [
              {
                model: db.Subject,
                attributes: ['id', 'code', 'name']
              }
            ]
          }
        ]
      }
    ],
    distinct: true,
    limit,
    offset
  });

  return {
    courses: rows.map(ct => ({
      id: ct.Course.id,
      code: ct.Course.code,
      name: ct.Course.name,
      subjects: ct.Course.CourseSubjects.map(cs => ({
        id: cs.Subject.id,
        code: cs.Subject.code,
        name: cs.Subject.name
      }))
    })),
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
};

exports.getClassesBySubjectTeacher = async (teacherId, collegeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Step 1: get all subjectIds that teacher is teaching
  const teacherSubjects = await db.TeacherSubjects.findAll({
    where: { teacherId },
    attributes: ['subjectId']
  });
  const subjectIds = teacherSubjects.map(ts => ts.subjectId);

  if (!subjectIds.length) {
    return { courses: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  // Step 2: find all course-subject mappings for these subjects in this college
  const { count, rows } = await db.CourseSubjects.findAndCountAll({
    where: { subjectId: { [Op.in]: subjectIds } },
    include: [
      {
        model: db.Course,
        where: { collegeId },
        attributes: ['id', 'code', 'name']
      },
      {
        model: db.Subject,
        attributes: ['id', 'code', 'name']
      }
    ],
    distinct: true,
    limit,
    offset
  });

  // Step 3: group subjects under their course
  const courseMap = {};
  rows.forEach(cs => {
    const courseId = cs.Course.id;
    if (!courseMap[courseId]) {
      courseMap[courseId] = {
        id: cs.Course.id,
        code: cs.Course.code,
        name: cs.Course.name,
        subjects: []
      };
    }
    courseMap[courseId].subjects.push({
      id: cs.Subject.id,
      code: cs.Subject.code,
      name: cs.Subject.name
    });
  });

  return {
    courses: Object.values(courseMap),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
  };
};

exports.getSubjectsWithClasses = async (teacherId, collegeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Get all subjectIds assigned to this teacher
  const teacherSubjects = await db.TeacherSubjects.findAll({
    where: { teacherId },
    attributes: ['subjectId']
  });
  const subjectIds = teacherSubjects.map(ts => ts.subjectId);

  if (!subjectIds.length) {
    return { subjects: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  // Fetch subjects that are mapped to courses as well
  const { count, rows } = await db.Subject.findAndCountAll({
    where: { id: { [Op.in]: subjectIds }, collegeId },
    include: [
      {
        model: db.CourseSubjects,
        include: [
          {
            model: db.Course,
            attributes: ['id', 'code', 'name'],
            where: { collegeId }
          }
        ]
      },
      {
        model: db.Timetable,
        as: 'Timetables',
        attributes: ['id', 'day', 'time', 'courseId', 'section', 'validFrom', 'validTo'],
        include: [{ model: db.Course, attributes: ['id', 'name'] }],
        where: {
          [Op.and]: [
            { validFrom: { [Op.lte]: new Date() } },
            { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }] }
          ]
        },
        required: false
      }
    ],
    distinct: true,
    limit,
    offset
  });

  return {
    subjects: rows.map(subject => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      courses: subject.CourseSubjects.map(cs => cs.Course),
      timetables: subject.Timetables
    })),
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