// services/markService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

// === Add Mark (same as before) ===
exports.addMark = async (payload, teacherId, collegeId) => {
  try {
    if (Array.isArray(payload.marks)) {
      // Bulk insert
      const data = payload.marks.map((m) => ({
        studentId: m.studentId,
        subjectId: m.subjectId,
        assignmentId: m.assignmentId || null,
        examId: m.examId || null,
        marks: m.marks,
        totalMarks: m.totalMarks || null,
        grade: m.grade || null,
        remarks: m.remarks || null,
        teacherId,
        collegeId,
      }));

      return await db.Mark.bulkCreate(data, { returning: true });
    } else {
      // Single insert
      return await db.Mark.create({
        studentId: payload.studentId,
        subjectId: payload.subjectId,
        assignmentId: payload.assignmentId || null,
        examId: payload.examId || null,
        marks: payload.marks,
        totalMarks: payload.totalMarks || null,
        grade: payload.grade || null,
        remarks: payload.remarks || null,
        teacherId,
        collegeId,
      });
    }
  } catch (err) {
    throw ApiError.badRequest(`Failed to add mark(s): ${err.message}`);
  }
};

// === Generic Get Marks with percentage ===
exports.getMarks = async (filter, user, { page = 1, limit = 10 }) => {
  const where = {};
  if (filter.studentId) where.studentId = filter.studentId;
  if (filter.assignmentId) where.assignmentId = filter.assignmentId;
  if (filter.examId) where.examId = filter.examId;

  if (user.role === 'teacher') where.teacherId = user.teacherId;
  if (user.role === 'student') where.studentId = user.studentId;

  const { rows, count } = await db.Mark.findAndCountAll({
    where,
    include: [
      { model: db.Student },
      { model: db.Subject },
      { model: db.Assignment },
      { model: db.Exam },
    ],
    offset: (page - 1) * limit,
    limit,
    order: [['createdAt', 'DESC']],
  });

  // add percentage to each row
  const marksWithPercentage = rows.map(m => {
    const mark = m.toJSON();
    if (mark.totalMarks && mark.marks != null) {
      mark.percentage = ((mark.marks / mark.totalMarks) * 100).toFixed(2);
    } else {
      mark.percentage = null;
    }
    return mark;
  });

  return { marks: marksWithPercentage, total: count, page, limit };
};

exports.getMarksByCourse = async (courseId, collegeId, options = { page: 1, limit: 10 }) => {
  const { page, limit } = options;

  // Get marks for all students in the given course
  const { rows, count } = await db.Mark.findAndCountAll({
    include: [
      {
        model: db.Student,
        where: { courseId, collegeId }, // only students in this course
        attributes: ['id', 'name', 'rollNo'], // optional fields
      },
      { model: db.Subject, attributes: ['id', 'name'] },
      { model: db.Assignment, attributes: ['id', 'title'] },
      { model: db.Exam, attributes: ['id', 'name'] },
    ],
    offset: (page - 1) * limit,
    limit,
    order: [['createdAt', 'DESC']],
  });

  // Add percentage
  const marksWithPercentage = rows.map(m => {
    const mark = m.toJSON();
    mark.percentage = mark.totalMarks && mark.marks != null
      ? ((mark.marks / mark.totalMarks) * 100).toFixed(2)
      : null;
    return mark;
  });

  return { marks: marksWithPercentage, total: count, page, limit };
};

exports.getStudentParentCheck = async (studentId, parentId) => {
  return await db.Student.findOne({
    where: { id: studentId, parentId },
  });
};

exports.getReportCard = async (studentId, collegeId) => {
  const student = await db.Student.findOne({
    where: { id: studentId, collegeId },
    attributes: ['id', 'name', 'rollNo', 'year', 'section'],
    include: [
      { model: db.Course, attributes: ['id', 'name'] },
      { 
        model: db.Fee, 
        attributes: ['id', 'amount', 'status'], // use 'status' instead of 'feesPaid'
      },
      { 
        model: db.Mark, 
        attributes: ['id', 'marks', 'totalMarks', 'grade', 'remarks'],
        include: [
          { model: db.Subject, attributes: ['id', 'name'] },
          { model: db.Exam, attributes: ['id', 'name', 'examDate'] },
          { model: db.Assignment, attributes: ['id', 'title'] },
        ],
        order: [['examId', 'ASC'], ['subjectId', 'ASC']],
      }
    ]
  });

  if (!student) throw new Error('Student not found');

  // Determine if all fees are fully paid
  const feesPaid = student.Fees.every(f => f.status === 'paid');

  // Build marks report
  const marks = student.Marks.map(m => {
    const percentage = (m.totalMarks && m.marks != null) 
      ? ((m.marks / m.totalMarks) * 100).toFixed(2) 
      : null;
    
    return {
      subject: m.Subject?.name || null,
      exam: m.Exam?.name || null,
      assignment: m.Assignment?.title || null,
      marks: m.marks,
      totalMarks: m.totalMarks,
      grade: m.grade,
      percentage,
      remarks: m.remarks
    };
  });

  return {
    studentId: student.id,
    name: student.name,
    rollNo: student.rollNo,
    course: student.Course?.name || null,
    year: student.year,
    section: student.section,
    feesPaid,
    marks
  };
};

