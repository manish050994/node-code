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
    // Expect payload to include startTime and endTime (HH:mm)
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
    order: [['day', 'ASC'], ['startTime', 'ASC']]
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

// upcoming class updated to use startTime and endTime ranges
exports.getUpcomingClass = async ({ user }) => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let todayIndex = new Date().getDay();
  // use local time 'HH:mm'
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

    // fetch all classes for that day ordered by startTime
    const classes = await db.Timetable.findAll({
      where,
      include: [
        { model: db.Subject, attributes: ['id', 'name', 'code'] },
        { model: db.Teacher, attributes: ['id', 'name', 'employeeId'] },
        { model: db.Course, attributes: ['id', 'name'] }
      ],
      order: [['startTime', 'ASC']]
    });

    if (!classes || classes.length === 0) continue;

    // if same day (i===0), find first with startTime >= now OR currently ongoing (start <= now <= end)
    for (const cls of classes) {
      const s = cls.startTime || ''; // 'HH:mm'
      const e = cls.endTime || '';   // 'HH:mm', maybe empty
      // consider ongoing if endTime exists and now between s and e
      const isOngoing = s && e && (moment(now, 'HH:mm').isBetween(moment(s, 'HH:mm'), moment(e, 'HH:mm'), null, '[]'));
      const startsLater = s && (moment(s, 'HH:mm').isSameOrAfter(moment(now, 'HH:mm')));
      if (i === 0) {
        if (isOngoing || startsLater) {
          return cls;
        }
      } else {
        // for next days, return the earliest class
        return cls;
      }
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

  const teacherSubjects = await db.TeacherSubjects.findAll({
    where: { teacherId },
    attributes: ['subjectId']
  });
  const subjectIds = teacherSubjects.map(ts => ts.subjectId);

  if (!subjectIds.length) {
    return { courses: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

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
        attributes: ['id', 'day', 'startTime', 'endTime', 'courseId', 'section', 'validFrom', 'validTo'],
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
  // updated fields
  const fields = ['day', 'startTime', 'endTime', 'subjectId', 'teacherId', 'courseId', 'section', 'validFrom', 'validTo'];
  const parser = new Parser({ fields });
  const sample = [
    {
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subjectId: 1,
      teacherId: 3,
      courseId: 1,
      section: 'A',
      validFrom: '2025-01-01',
      validTo: '2025-12-31'
    }
  ];
  return parser.parse(sample);
};


exports.importCsv = async (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', row => {
        // require startTime and endTime now
        if (!row.day || !row.startTime || !row.endTime || !row.subjectId || !row.teacherId || !row.courseId) {
          // use reject via error thrown inside stream will crash; better to push error to reject after stream ends
          // but we'll throw ApiError to abort stream
          throw new ApiError(400, 'CSV row missing required fields: day, startTime, endTime, subjectId, teacherId, courseId');
        }
        // optional: validate format of startTime/endTime here (HH:mm)
        results.push({
          day: row.day,
          startTime: row.startTime,
          endTime: row.endTime,
          subjectId: parseInt(row.subjectId),
          teacherId: parseInt(row.teacherId),
          courseId: parseInt(row.courseId),
          section: row.section || null,
          validFrom: row.validFrom ? new Date(row.validFrom) : null,
          validTo: row.validTo ? new Date(row.validTo) : null,
          collegeId
        });
      })
      .on('end', async () => {
        const t = await db.sequelize.transaction();
        try {
          // use transaction variable t
          const timetables = await db.Timetable.bulkCreate(results, { transaction: t });
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
