const db = require('../models');
const ApiError = require('../utils/ApiError');
const { exportToExcel, generateFileName } = require('../utils/excelExport');

exports.progressReport = async ({ studentId, collegeId }) => {
  if (!studentId) throw ApiError.badRequest('studentId required');
  const student = await db.Student.findOne({
    where: { id: studentId, collegeId },
    include: [
      { model: db.Course, as: 'Course' },
      { model: db.Parent, as: 'Parent' },
    ],
  });
  if (!student) throw ApiError.notFound('Student not found');
  const totalAttendance = await db.Attendance.count({ where: { studentId, collegeId } });
  const presentAttendance = await db.Attendance.count({
    where: { studentId, collegeId, status: 'present' },
  });
  const attendancePercentage = totalAttendance > 0
    ? ((presentAttendance / totalAttendance) * 100).toFixed(2)
    : 0;
  const marks = await db.Mark.findAll({
    where: { studentId, collegeId },
    include: [{ model: db.Subject, as: 'Subject' }],
  });
  const averageMarks = marks.length > 0
    ? (marks.reduce((sum, mark) => sum + mark.marks, 0) / marks.length).toFixed(2)
    : 0;
  const fees = await db.Fee.findAll({
    where: { studentId, collegeId },
    include: [{ model: db.Course, as: 'Course' }],
  });
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidFees = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
  const feeCollectionPercentage = totalFees > 0
    ? ((paidFees / totalFees) * 100).toFixed(2)
    : 0;
  return {
    student,
    attendance: {
      total: totalAttendance,
      present: presentAttendance,
      percentage: parseFloat(attendancePercentage),
    },
    academic: {
      marks,
      average: parseFloat(averageMarks),
      subjectsCompleted: marks.length,
    },
    fees: {
      total: totalFees,
      paid: paidFees,
      pending: totalFees - paidFees,
      collectionPercentage: parseFloat(feeCollectionPercentage),
      feeRecords: fees,
    },
    reportGeneratedAt: new Date(),
  };
};

exports.attendanceSummary = async ({ from, to, collegeId, page = 1, limit = 10 }) => {
  if (!from || !to) throw ApiError.badRequest('from and to query parameters required');
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  const offset = (page - 1) * limit;
  const data = await db.Attendance.findAll({
    where: {
      date: { [db.Sequelize.Op.between]: [fromDate, toDate] },
      collegeId,
    },
    attributes: [
      'studentId',
      [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalDays'],
      [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), 'presentDays'],
      [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'absent' THEN 1 ELSE 0 END`)), 'absentDays'],
      [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'late' THEN 1 ELSE 0 END`)), 'lateDays'],
    ],
    include: [{
      model: db.Student,
      as: 'Student',
      attributes: ['id', 'name', 'rollNo', 'courseId'],
    }],
    group: ['studentId', 'Student.id'],
    offset,
    limit,
  });
  const total = await db.Attendance.count({
    where: {
      date: { [db.Sequelize.Op.between]: [fromDate, toDate] },
      collegeId,
    },
    distinct: true,
    col: 'studentId',
  });
  return {
    summary: data.map(item => ({
      student: {
        id: item.Student.id,
        name: item.Student.name,
        rollNo: item.Student.rollNo,
        course: item.Student.courseId,
      },
      totalDays: parseInt(item.dataValues.totalDays),
      presentDays: parseInt(item.dataValues.presentDays),
      absentDays: parseInt(item.dataValues.absentDays),
      lateDays: parseInt(item.dataValues.lateDays),
      attendancePercentage: item.dataValues.totalDays > 0
        ? ((item.dataValues.presentDays / item.dataValues.totalDays) * 100).toFixed(2)
        : 0,
    })),
    total,
    page,
    limit,
  };
};

exports.getAnnualRecords = async ({ page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const colleges = await db.College.findAll({
    where: { status: true },
    offset,
    limit,
  });
  if (colleges.length === 0) {
    return {
      message: 'No active colleges found',
      colleges: [],
      summary: {
        totalColleges: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalFees: 0,
        collectedFees: 0,
      },
    };
  }
  const annualData = await Promise.all(colleges.map(async (college) => {
    try {
      const collegeId = college.id;
      const totalStudents = await db.Student.count({ where: { collegeId } });
      const activeStudents = await db.Student.count({ where: { collegeId, feesPaid: true } });
      const totalTeachers = await db.Teacher.count({ where: { collegeId } });
      const activeTeachers = await db.Teacher.count({
        where: { collegeId },
        include: [{
          model: db.Subject,
          as: 'Subjects',
          through: { attributes: [] },
          required: true,
        }],
      });
      const currentYearStart = new Date(new Date().getFullYear(), 6, 1);
      const currentYearEnd = new Date(new Date().getFullYear() + 1, 5, 30);
      const totalAttendanceDays = await db.Attendance.count({
        where: { collegeId, date: { [db.Sequelize.Op.between]: [currentYearStart, currentYearEnd] } },
      });
      const presentAttendanceDays = await db.Attendance.count({
        where: { collegeId, date: { [db.Sequelize.Op.between]: [currentYearStart, currentYearEnd] }, status: 'present' },
      });
      const avgAttendancePercentage = totalAttendanceDays > 0
        ? ((presentAttendanceDays / totalAttendanceDays) * 100).toFixed(2)
        : 0;
      const totalFees = await db.Fee.sum('amount', { where: { collegeId } });
      const paidFees = await db.Fee.sum('amount', { where: { collegeId, status: 'paid' } });
      const feeCollectionPercentage = totalFees > 0
        ? ((paidFees / totalFees) * 100).toFixed(2)
        : 0;
      const totalMarks = await db.Mark.count({ where: { collegeId } });
      const avgMarks = await db.Mark.findOne({
        attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('marks')), 'average']],
        where: { collegeId },
      });
      const totalLeaveRequests = await db.TeacherLeaveRequest.count({ where: { collegeId } });
      const pendingLeaveRequests = await db.TeacherLeaveRequest.count({ where: { collegeId, status: 'Pending' } });
      return {
        college: {
          id: college.id,
          name: college.name,
          code: college.code,
          address: college.address,
        },
        statistics: {
          students: {
            total: totalStudents,
            active: activeStudents,
            percentageActive: totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(2) : 0,
          },
          teachers: {
            total: totalTeachers,
            active: activeTeachers,
            percentageActive: totalTeachers > 0 ? ((activeTeachers / totalTeachers) * 100).toFixed(2) : 0,
          },
          attendance: {
            totalDays: totalAttendanceDays,
            presentDays: presentAttendanceDays,
            averagePercentage: parseFloat(avgAttendancePercentage),
          },
          fees: {
            totalAmount: totalFees || 0,
            collectedAmount: paidFees || 0,
            pendingAmount: (totalFees || 0) - (paidFees || 0),
            collectionPercentage: parseFloat(feeCollectionPercentage),
            totalRecords: await db.Fee.count({ where: { collegeId } }),
          },
          academics: {
            totalMarksEntered: totalMarks,
            averageStudentMarks: avgMarks?.dataValues?.average?.toFixed(2) || 0,
            subjectsWithGrades: await db.Mark.count({ where: { collegeId }, distinct: true, col: 'subjectId' }),
          },
          leaves: {
            totalRequests: totalLeaveRequests,
            pendingRequests: pendingLeaveRequests,
            pendingPercentage: totalLeaveRequests > 0 ? ((pendingLeaveRequests / totalLeaveRequests) * 100).toFixed(2) : 0,
          },
        },
        features: college.features,
        lastUpdated: new Date(),
      };
    } catch (error) {
      return null;
    }
  }));
  const validColleges = annualData.filter(college => college !== null);
  const total = await db.College.count({ where: { status: true } });
  const overallSummary = validColleges.reduce((summary, collegeData) => {
    const stats = collegeData.statistics;
    summary.totalColleges += 1;
    summary.totalStudents += stats.students.total;
    summary.totalTeachers += stats.teachers.total;
    summary.totalFees += stats.fees.totalAmount;
    summary.collectedFees += stats.fees.collectedAmount;
    summary.totalAttendanceDays += stats.attendance.totalDays;
    summary.totalPresentDays += stats.attendance.presentDays;
    summary.totalMarks += stats.academics.totalMarksEntered;
    return summary;
  }, {
    totalColleges: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalFees: 0,
    collectedFees: 0,
    totalAttendanceDays: 0,
    totalPresentDays: 0,
    totalMarks: 0,
  });
  const overallCollectionPercentage = overallSummary.totalFees > 0
    ? ((overallSummary.collectedFees / overallSummary.totalFees) * 100).toFixed(2)
    : 0;
  const overallAttendancePercentage = overallSummary.totalAttendanceDays > 0
    ? ((overallSummary.totalPresentDays / overallSummary.totalAttendanceDays) * 100).toFixed(2)
    : 0;
  return {
    generatedAt: new Date(),
    summary: {
      ...overallSummary,
      collectionPercentage: parseFloat(overallCollectionPercentage),
      attendancePercentage: parseFloat(overallAttendancePercentage),
    },
    colleges: validColleges,
    total,
    page,
    limit,
  };
};

exports.exportAnnualRecords = async (req) => {
  const data = await exports.getAnnualRecords({ page: 1, limit: 1000 });
  const filename = generateFileName('annual-report');
  const fileInfo = await exportToExcel(req, data, filename);
  return {
    message: 'Annual report generated successfully',
    downloadUrl: fileInfo.fullPath,
    filename: fileInfo.filename,
    fileSize: `${(fileInfo.size / 1024).toFixed(2)} KB`,
    generatedAt: fileInfo.generatedAt,
    collegesProcessed: data.colleges.length,
    summary: data.summary,
  };
};