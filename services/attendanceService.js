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
        return record; // return only the record, not [record, created]
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

  // Handle multiple students or all students
  if (q.studentIds) {
    // Expecting comma-separated IDs or array
    let studentArray = [];
    if (Array.isArray(q.studentIds)) {
      studentArray = q.studentIds.map(id => parseInt(id));
    } else if (typeof q.studentIds === 'string') {
      studentArray = q.studentIds.split(',').map(id => parseInt(id));
    }
    if (studentArray.length > 0) filter.studentId = { [db.Sequelize.Op.in]: studentArray };
  } else if (q.student) {
    filter.studentId = parseInt(q.student); // single student
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

  const { rows, count } = await db.Attendance.findAndCountAll({
    where: filter,
    include: [{ model: db.Student, as: 'Student', attributes: ['id', 'name'] }],
    offset,
    limit,
    order: [['date', 'ASC'], ['studentId', 'ASC']],
  });

  return { attendances: rows, total: count, page, limit };
};


exports.uploadOffline = (filePath, collegeId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const t = await sequelize.transaction();
        try {
          const attendances = await Promise.all(results.map(async (row) => {
            if (!row.studentId || !row.date || !row.status) {
              throw ApiError.badRequest('CSV row missing required fields: studentId, date, status');
            }
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
          // Clean up the uploaded file
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          resolve({ count: attendances.length });
        } catch (err) {
          await t.rollback();
          // Clean up file on error
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });
          reject(ApiError.badRequest(`Failed to upload attendance: ${err.message}`));
        }
      })
      .on('error', (err) => {
        // Clean up file on stream error
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
        reject(ApiError.badRequest(`Failed to read CSV: ${err.message}`));
      });
  });
};