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

  // Fetch all marks for students in the given course
  const { rows, count } = await db.Mark.findAndCountAll({
    include: [
      {
        model: db.Student,
        where: { courseId, collegeId },
        attributes: ['id', 'name', 'rollNo'],
      },
      { model: db.Subject, attributes: ['id', 'name'] },
      { model: db.Assignment, attributes: ['id', 'title'] },
      { model: db.Exam, attributes: ['id', 'name'] },
    ],
    offset: (page - 1) * limit,
    limit,
    order: [['createdAt', 'DESC']],
  });

  // Prepare arrays for exams and assignments
  const examMarks = [];
  const assignmentMarks = [];

  // Add percentage and categorize
  rows.forEach(m => {
    const mark = m.toJSON();
    mark.percentage =
      mark.totalMarks && mark.marks != null
        ? ((mark.marks / mark.totalMarks) * 100).toFixed(2)
        : null;

    if (mark.examId && mark.Exam) {
      examMarks.push(mark);
    } else if (mark.assignmentId && mark.Assignment) {
      assignmentMarks.push(mark);
    }
  });

  return {
    marks: examMarks,           // exam-based marks
    assignment: assignmentMarks, // assignment-based marks
    total: count,
    page,
    limit,
  };
};

exports.getStudentParentCheck = async (studentId, parentId) => {
  return await db.Student.findOne({
    where: { id: studentId, parentId },
  });
};

exports.getReportCard = async (studentId, collegeId) => {
  const student = await db.Student.findOne({
    where: { id: studentId, collegeId },
    attributes: [
      'id', 'name', 'rollNo', 'year', 'section', 'gender',
      'motherName', 'fatherName', 'category', 'collegeId'
    ],
    include: [
      {
        model: db.Course,
        attributes: ['id', 'name']
      },
      {
        model: db.Fee,
        attributes: ['id', 'amount', 'status']
      },
      {
        model: db.Mark,
        attributes: ['id', 'marks', 'totalMarks', 'grade', 'remarks'],
        include: [
          { model: db.Subject, attributes: ['id', 'name', 'code', 'teacherId'] },
          { model: db.Exam, attributes: ['id', 'name', 'examDate', 'description', 'totalMarks'] }
        ]
      }
    ]
  });

  if (!student) {
    return {
      status: false,
      message: 'Student not found',
      data: []
    };
  }

  // Check if all fees are paid
  const feesPaid = student.Fees?.every(fee => fee.status === 'paid') || false;

  // Group marks by exam
  const examsMap = new Map();

  student.Marks.forEach(mark => {
    const exam = mark.Exam;
    if (!exam) return;

    if (!examsMap.has(exam.id)) {
      examsMap.set(exam.id, {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.examDate,
        description: exam.description,
        totalMarks: exam.totalMarks,
        subjects: []
      });
    }

    const percentage =
      mark.totalMarks && mark.marks != null
        ? ((mark.marks / mark.totalMarks) * 100).toFixed(2)
        : null;

    examsMap.get(exam.id).subjects.push({
      subjectId: mark.Subject?.id || null,
      subjectName: mark.Subject?.name || null,
      subjectCode: mark.Subject?.code || null,
      marks: mark.marks,
      totalMarks: mark.totalMarks,
      percentage,
      grade: mark.grade,
      remarks: mark.remarks,
      teacherId: mark.Subject?.teacherId || null
    });
  });

  const exams = Array.from(examsMap.values());

  const responseData = {
    studentId: student.id,
    name: student.name,
    rollNo: student.rollNo,
    year: student.year,
    section: student.section,
    gender: student.gender,
    motherName: student.motherName,
    fatherName: student.fatherName,
    category: student.category,
    collegeId: student.collegeId,
    course: student.Course?.name || null,
    feesPaid,
    exams
  };

  return {
    status: true,
    message: 'Marks fetched',
    data: [responseData]
  };
};



