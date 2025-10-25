// services/attendanceService.js
const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const csv = require('csv-parser');

function normalizeDateToDay(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) throw ApiError.badRequest('Invalid date');
  return new Date(d.toISOString().slice(0, 10));
}

exports.markAttendance = async ({ attendances, date, collegeId }) => {
  if (!attendances || !Array.isArray(attendances) || !date) throw ApiError.badRequest('attendances array and date required');
  const day = normalizeDateToDay(date);
  const t = await sequelize.transaction();
  try {
    const results = await Promise.all(
      attendances.map(async ({ studentId, status }) => {
        const [record] = await db.Attendance.upsert(
          {
            studentId: parseInt(studentId),
            date: day,
            status,
            collegeId,
          },
          { transaction: t, conflictFields: ['studentId', 'date'] }
        );
        return record;
      })
    );
    await t.commit();
    return results;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to mark attendance: ${error.message}`);
  }
};

exports.getAttendance = async ({ q = {}, collegeId, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const filter = { collegeId };

  // Handle status filter
  if (q.status && ['present', 'absent', 'late'].includes(q.status)) {
    filter.status = q.status;
  } else if (q.status && q.status !== 'all') {
    throw ApiError.badRequest('Invalid status filter: must be present, absent, late, or all');
  }

  // Handle multiple students or all students
  if (q.studentIds) {
    let studentArray = [];
    if (Array.isArray(q.studentIds)) {
      studentArray = q.studentIds.map(id => parseInt(id));
    } else if (typeof q.studentIds === 'string') {
      studentArray = q.studentIds.split(',').map(id => parseInt(id));
    }
    if (studentArray.length > 0) filter.studentId = { [db.Sequelize.Op.in]: studentArray };
  } else if (q.student) {
    filter.studentId = parseInt(q.student);
  }

  // Date filters
  if (q.from && q.to) {
    const from = normalizeDateToDay(q.from);
    const to = normalizeDateToDay(q.to);
    filter.date = { [db.Sequelize.Op.between]: [from, to] };
  } else if (q.from) {
    filter.date = { [db.Sequelize.Op.gte]: normalizeDateToDay(q.from) };
  } else if (q.to) {
    filter.date = { [db.Sequelize.Op.lte]: normalizeDateToDay(q.to) };
  }


    // Handle course filter
  if (q.courseId) {
    filter['$Student.courseId$'] = parseInt(q.courseId);
  }

  const { rows, count } = await db.Attendance.findAndCountAll({
    where: filter,
    include: [{ model: db.Student, as: 'Student', attributes: ['id', 'name','courseId'] }],
    offset,
    limit,
    order: [['date', 'ASC'], ['studentId', 'ASC']],
  });

  return { attendances: rows, total: count, page, limit };
};

exports.uploadOffline = async (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (!data.studentId || !data.date || !data.status) {
          throw ApiError.badRequest('CSV row missing required fields: studentId, date, status');
        }
        if (!['present', 'absent', 'late'].includes(data.status)) {
          throw ApiError.badRequest(`Invalid status in CSV: ${data.status}`);
        }
        results.push(data);
      })
      .on('end', async () => {
        const t = await sequelize.transaction();
        try {
          const attendances = await Promise.all(results.map(async (row) => {
            return await db.Attendance.upsert({
              studentId: parseInt(row.studentId),
              date: normalizeDateToDay(row.date),
              status: row.status,
              collegeId,
            }, {
              transaction: t,
              fields: ['status', 'collegeId'],
              conflictFields: ['studentId', 'date'],
            });
          }));
          await t.commit();
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          resolve({ count: attendances.length });
        } catch (err) {
          await t.rollback();
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          reject(ApiError.badRequest(`Failed to upload attendance: ${err.message}`));
        }
      })
      .on('error', (err) => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
        reject(ApiError.badRequest(`Failed to read CSV: ${err.message}`));
      });
  });
};

exports.getStudentAttendanceOverview = async ({ studentId, collegeId }) => {
  if (!studentId) throw ApiError.badRequest('Student ID required');

  const total = await db.Attendance.count({ where: { studentId, collegeId } });
  const present = await db.Attendance.count({ where: { studentId, collegeId, status: 'present' } });
  const absent = await db.Attendance.count({ where: { studentId, collegeId, status: 'absent' } });
  const late = await db.Attendance.count({ where: { studentId, collegeId, status: 'late' } });

  const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    total,
    present,
    absent,
    late,
    attendancePercentage,
  };
};

exports.getParentAttendanceOverview = async ({ parentId, collegeId }) => {
  if (!parentId) throw ApiError.badRequest('Parent ID required');

  const students = await db.Student.findAll({
    where: { parentId, collegeId },
    attributes: ['id', 'name'],
  });

  const overviews = await Promise.all(
    students.map(async (student) => {
      const total = await db.Attendance.count({ where: { studentId: student.id, collegeId } });
      const present = await db.Attendance.count({ where: { studentId: student.id, collegeId, status: 'present' } });
      const absent = await db.Attendance.count({ where: { studentId: student.id, collegeId, status: 'absent' } });
      const late = await db.Attendance.count({ where: { studentId: student.id, collegeId, status: 'late' } });

      const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        total,
        present,
        absent,
        late,
        attendancePercentage,
      };
    })
  );

  return overviews;
};
