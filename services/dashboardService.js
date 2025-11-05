// services\dashboardService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.getSuperAdminDashboard = async () => {
  const totalColleges = await db.College.count();
  const activeUsers = await db.User.count();
  return { totalColleges, activeUsers };
};

exports.getCollegeAdminDashboard = async (collegeId) => {
  const students = await db.Student.count({ where: { collegeId } });
  const teachers = await db.Teacher.count({ where: { collegeId } });
  const feeCollections = await db.Fee.sum('amount', {
    where: { collegeId, status: 'paid' },
  });
  const today = new Date().toISOString().slice(0, 10);
  const present = await db.Attendance.count({
    where: { collegeId, date: today, status: 'present' },
  });
  return { students, teachers, feeCollections: feeCollections || 0, presentToday: present };
};

exports.getTeacherDashboard = async (teacherId) => {
  const teacher = await db.Teacher.findOne({
    where: { id: teacherId },
    include: [{ model: db.Subject, as: 'Subjects', through: { attributes: [] } }],
  });
  if (!teacher) throw ApiError.notFound('Teacher not found');
  const leaves = await db.TeacherLeaveRequest.count({
    where: { teacherId, status: 'Pending' },
  });
  return { assignedSubjects: teacher.Subjects, pendingLeaves: leaves };
};

exports.getStudentDashboard = async (studentId) => {
  // Get the student with the course details
  const student = await db.Student.findOne({
    where: { id: studentId },
    include: [{ model: db.Course, as: 'Course', attributes: ['id', 'name'] }],
  });

  if (!student) throw ApiError.notFound('Student not found');

  // Attendance Count
  const attendanceCount = await db.Attendance.count({
    where: { studentId, status: 'present' },
  });

  // Marks / Grades
   const gradesData = await db.Mark.findAll({
    where: { studentId },
    attributes: ['subjectId', 'marks'],
    include: [
      { model: db.Subject, as: 'Subject', attributes: ['name'] }
    ],
  });

  // Convert to desired structure
  const grades = gradesData.map(mark => ({
    subjectId: mark.subjectId,
    marks: mark.marks,
    Subjectname: mark.Subject ? mark.Subject.name : null
  }));

  // Fee status month-wise
  const fees = await db.Fee.findAll({
    where: { studentId },
    attributes: ['amount', 'status', 'dueDate'],
  });

  const feeStatus = fees.map(fee => ({
    month: fee.dueDate ? fee.dueDate.toLocaleString('default', { month: 'long' }) : 'N/A',
    paid: fee.status === 'paid',
    amount: fee.amount,
  }));

  return {
    student,
    attendance: attendanceCount,
    grades,
    feeStatus,
  };
};


exports.getParentDashboard = async (parentId) => {
  // Fetch all students for the parent
  const students = await db.Student.findAll({
    where: { parentId },
    include: [{ model: db.Course, as: 'Course', attributes: ['id', 'name'] }],
  });

  if (!students || students.length === 0) {
    throw ApiError.notFound('No students found for this parent');
  }

  // For each student, fetch attendance, grades, and feeStatus
  const dashboardData = await Promise.all(
    students.map(async (student) => {
      // Count total present days
      const attendanceCount = await db.Attendance.count({
        where: { studentId: student.id, status: 'present' },
      });

       const gradesData = await db.Mark.findAll({
    where: { studentId },
    attributes: ['subjectId', 'marks'],
    include: [
      { model: db.Subject, as: 'Subject', attributes: ['name'] }
    ],
  });

  // Convert to desired structure
  const grades = gradesData.map(mark => ({
    subjectId: mark.subjectId,
    marks: mark.marks,
    Subjectname: mark.Subject ? mark.Subject.name : null
  }));

      // Fetch fees and map to month-wise status (assuming dueDate is the fee month)
      const fees = await db.Fee.findAll({
        where: { studentId: student.id },
        attributes: ['amount', 'status', 'dueDate'],
      });

      const feeStatus = fees.map(fee => ({
        month: fee.dueDate ? fee.dueDate.toLocaleString('default', { month: 'long' }) : 'N/A',
        paid: fee.status === 'paid',
        amount: fee.amount,
      }));

      return {
        student,
        attendance: attendanceCount,
        grades,
        feeStatus,
      };
    })
  );

  return dashboardData;
};
