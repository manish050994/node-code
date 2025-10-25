const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const path = require('path'); 

exports.createAssignmentWithQuestions = async (payload, teacherId, collegeId, files, req) => {
  const t = await sequelize.transaction();
  try {
    const questions = payload.questions || [];
    const host = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;

    const assignment = await db.Assignment.create({
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate,
      teacherId,
      subjectId: payload.subjectId,
      courseId: payload.courseId,
      collegeId,
    }, { transaction: t });

    const questionRecords = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const filePath = q.questionFile || null;
      const fileUrl = filePath ? `${host}/uploads/${path.basename(filePath)}` : null;

      const question = await db.AssignmentQuestion.create({
        assignmentId: assignment.id,
        title: q.title || null,
        questionFile: fileUrl, // Store full URL in questionFile
        marks: q.marks || 0,
      }, { transaction: t });
      questionRecords.push({
        ...question.dataValues
      });
    }

    await t.commit();

    const result = await db.Assignment.findOne({
      where: { id: assignment.id },
      include: [{ model: db.AssignmentQuestion }],
    });

    return {
      ...result.dataValues,
      AssignmentQuestions: result.AssignmentQuestions.map(q => ({
        ...q.dataValues
      }))
    };
  } catch (error) {
    await t.rollback();
    throw new ApiError(400, `Failed to create assignment: ${error.message}`);
  }
};

exports.getAssignments = async (user, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  let filter = { collegeId: user.collegeId };
  if (user.role === 'teacher') filter.teacherId = user.teacherId;
  if (user.role === 'student') {
    const student = await db.Student.findOne({ where: { id: user.studentId } });
    if (!student) throw new ApiError(404, 'Student not found');
    filter.courseId = student.courseId;
  }
  const { rows, count } = await db.Assignment.findAndCountAll({
    where: filter,
    include: [{ model: db.AssignmentQuestion }],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
  return { assignments: rows, total: count, page, limit };
};

exports.submitAssignment = async (id, studentId, file, text) => {
  const t = await sequelize.transaction();
  try {
    const assignment = await db.Assignment.findOne({ where: { id }, transaction: t });
    if (!assignment) throw new ApiError(404, 'Assignment not found');

    const submission = await db.Submission.create({
      assignmentId: id,
      studentId,
      file,
      text,
      submittedAt: new Date(),
    }, { transaction: t });

    await t.commit();
    return submission;
  } catch (error) {
    await t.rollback();
    throw new ApiError(400, `Failed to submit assignment: ${error.message}`);
  }
};

exports.getSubmissions = async (id, teacherId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const assignment = await db.Assignment.findOne({ where: { id, teacherId } });
  if (!assignment) throw new ApiError(404, 'Assignment not found or unauthorized');
  const { rows, count } = await db.Submission.findAndCountAll({
    where: { assignmentId: id },
    include: [{ model: db.Student }],
    offset,
    limit,
    order: [['submittedAt', 'DESC']],
  });
  return { submissions: rows, total: count, page, limit };
};


exports.getAssignmentsBySubject = async (user, subjectId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  if (user.role !== 'student') {
    throw new ApiError(403, 'Only students can view assignments by subject');
  }

  const student = await db.Student.findOne({ where: { id: user.studentId } });
  if (!student) throw new ApiError(404, 'Student not found');

  const filter = {
    collegeId: user.collegeId,
    courseId: student.courseId,
    subjectId,
  };

  const { rows, count } = await db.Assignment.findAndCountAll({
    where: filter,
    include: [
      { model: db.AssignmentQuestion },
      {
        model: db.Subject,
        attributes: ['id', 'name', 'code'],
      },
      {
        model: db.Teacher,
        attributes: ['id', 'name'],
      },
    ],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    assignments: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
  };
};
