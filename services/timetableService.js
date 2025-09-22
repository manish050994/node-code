// services/timetableService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');


exports.createTimetable = async (payload, collegeId, transaction = null) => {
  try {
    const timetable = await db.Timetable.create(
      { ...payload, collegeId },
      { transaction }
    );
    return timetable;
  } catch (error) {
    throw new ApiError(500, 'Failed to create timetable', error);
  }
};


exports.getTimetable = async (user, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const where = { collegeId: user.collegeId };

  // Role-based filtering
  if (user.role === 'teacher') {
    where.teacherId = user.teacherId;
  } else if (user.role === 'student') {
    // Fetch student's courseId
    const student = await db.Student.findByPk(user.studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    where.courseId = student.courseId;
  }

  // Fetch timetable entries
  const { count, rows } = await db.Timetable.findAndCountAll({
    where,
    include: [
      { model: db.Subject, attributes: ['id', 'name', 'code'] },
      { model: db.Teacher, attributes: ['id', 'name', 'employeeId'] }
    ],
    limit,
    offset,
    order: [
      ['day', 'ASC'],
      ['time', 'ASC']
    ]
  });

  return {
    timetable: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
};
