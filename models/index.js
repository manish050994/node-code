// models/index.js
'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
host: config.host,
port: config.port,
dialect: config.dialect,
logging: config.logging ? console.log : false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models (each only once)
db.Assignment = require('./Assignment')(sequelize, DataTypes);
db.AssignmentQuestion = require('./AssignmentQuestion')(sequelize, DataTypes);
db.Submission = require('./submission')(sequelize, DataTypes);
db.Mark = require('./Mark')(sequelize, DataTypes);
db.Exam = require("./Exams")(sequelize, Sequelize.DataTypes);
db.Attendance = require('./Attendance')(sequelize, DataTypes);
db.College = require('./College')(sequelize, DataTypes);
db.Course = require('./Course')(sequelize, DataTypes);
db.Fee = require('./Fee')(sequelize, DataTypes);
db.Log = require('./Log')(sequelize, DataTypes);
db.Message = require('./Message')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);
db.Parent = require('./Parent')(sequelize, DataTypes);
db.Student = require('./Student')(sequelize, DataTypes);
db.StudentLeaveRequest = require('./StudentLeaveRequest')(sequelize, DataTypes);
db.Subject = require('./Subject')(sequelize, DataTypes);
db.Teacher = require('./Teacher')(sequelize, DataTypes);
db.TeacherLeaveRequest = require('./TeacherLeaveRequest')(sequelize, DataTypes);
db.TeacherSubjects = require('./teachersubjects')(sequelize, DataTypes);
db.Timetable = require('./Timetable')(sequelize, DataTypes);
db.User = require('./User')(sequelize, DataTypes);
db.CourseTeachers = require('./courseteachers')(sequelize, DataTypes);
db.CourseSubjects = require('./coursesubjects')(sequelize, DataTypes);

// ---------------- Associations ----------------

// Assignment
db.Assignment.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Assignment.belongsTo(db.Subject, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
db.Assignment.belongsTo(db.Course, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Assignment.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Assignment.hasMany(db.AssignmentQuestion, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
db.Assignment.hasMany(db.Submission, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });

// AssignmentQuestion
db.AssignmentQuestion.belongsTo(db.Assignment, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });

// Submission
db.Submission.belongsTo(db.Assignment, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
db.Submission.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });

// Attendance
db.Attendance.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Attendance.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// College
db.College.hasMany(db.Course, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Student, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Teacher, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Subject, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Fee, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Assignment, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Attendance, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Log, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Mark, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Notification, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Parent, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.StudentLeaveRequest, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.TeacherLeaveRequest, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.Timetable, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.College.hasMany(db.User, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Course
db.Course.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Course.hasMany(db.Student, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Course.hasMany(db.Assignment, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Course.hasMany(db.Fee, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Course.hasMany(db.Timetable, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Course.belongsToMany(db.Subject, { through: 'CourseSubjects', foreignKey: 'courseId', onDelete: 'CASCADE' });
db.Course.belongsToMany(db.Teacher, { through: 'CourseTeachers', foreignKey: 'courseId', onDelete: 'CASCADE' });

// Fee
db.Fee.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Fee.belongsTo(db.Course, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Fee.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Log
db.Log.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Mark
db.Mark.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Mark.belongsTo(db.Subject, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
db.Mark.belongsTo(db.Assignment, { foreignKey: 'assignmentId', onDelete: 'SET NULL' });
db.Mark.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Mark.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Mark.belongsTo(db.Exam, { foreignKey: 'examId', onDelete: 'SET NULL' });
db.Exam.hasMany(db.Mark, { foreignKey: 'examId', onDelete: 'SET NULL' });

// Message
db.Message.belongsTo(db.User, { foreignKey: 'fromId', as: 'from', onDelete: 'RESTRICT' });
db.Message.belongsTo(db.User, { foreignKey: 'toId', as: 'to', onDelete: 'RESTRICT' });

// Notification
db.Notification.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Parent
db.Parent.hasMany(db.Student, { foreignKey: 'parentId', onDelete: 'SET NULL' });
db.Parent.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Parent.hasOne(db.User, { foreignKey: 'parentId', onDelete: 'SET NULL' });

// Student
db.Student.belongsTo(db.Course, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Student.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Student.belongsTo(db.Parent, { foreignKey: 'parentId', onDelete: 'SET NULL' });
db.Student.hasMany(db.Fee, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Student.hasMany(db.Attendance, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Student.hasMany(db.Mark, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Student.hasMany(db.StudentLeaveRequest, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Student.hasMany(db.Submission, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.Student.hasOne(db.User, { foreignKey: 'studentId', onDelete: 'SET NULL' });

// StudentLeaveRequest
db.StudentLeaveRequest.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
db.StudentLeaveRequest.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Subject
db.Subject.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Subject.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'CASCADE' });
db.Subject.belongsToMany(db.Course, { through: 'CourseSubjects', foreignKey: 'subjectId', onDelete: 'CASCADE' });
db.Subject.hasMany(db.Mark, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
db.Subject.hasMany(db.Timetable, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
db.Subject.belongsToMany(db.Teacher, { through: 'TeacherSubjects', foreignKey: 'subjectId', otherKey: 'teacherId', as: 'Teachers', onDelete: 'CASCADE' });

// Teacher
db.Teacher.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.Teacher.belongsToMany(db.Subject, { through: 'TeacherSubjects', foreignKey: 'teacherId', otherKey: 'subjectId', as: 'Subjects', onDelete: 'CASCADE' });
db.Teacher.belongsToMany(db.Course, { through: 'CourseTeachers', foreignKey: 'teacherId', onDelete: 'CASCADE' });
db.Teacher.hasMany(db.Assignment, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Teacher.hasMany(db.Mark, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Teacher.hasMany(db.Timetable, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Teacher.hasMany(db.TeacherLeaveRequest, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });

// TeacherLeaveRequest
db.TeacherLeaveRequest.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.TeacherLeaveRequest.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// Timetable
db.Timetable.belongsTo(db.Subject, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
db.Timetable.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
db.Timetable.belongsTo(db.Course, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
db.Timetable.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });

// User
db.User.belongsTo(db.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
db.User.belongsTo(db.Student, { foreignKey: 'studentId', onDelete: 'SET NULL' });
db.User.belongsTo(db.Teacher, { foreignKey: 'teacherId', onDelete: 'SET NULL' });
db.User.belongsTo(db.Parent, { foreignKey: 'parentId', onDelete: 'SET NULL' });
db.User.hasMany(db.Message, { foreignKey: 'fromId', as: 'sentMessages', onDelete: 'RESTRICT' });
db.User.hasMany(db.Message, { foreignKey: 'toId', as: 'receivedMessages', onDelete: 'RESTRICT' });


// --- CourseTeachers ---
db.CourseTeachers.belongsTo(db.Course, { foreignKey: 'courseId' });
db.CourseTeachers.belongsTo(db.Teacher, { foreignKey: 'teacherId' });
db.Course.hasMany(db.CourseTeachers, { foreignKey: 'courseId' });
db.Teacher.hasMany(db.CourseTeachers, { foreignKey: 'teacherId' });

// --- CourseSubjects ---
db.CourseSubjects.belongsTo(db.Course, { foreignKey: 'courseId' });
db.CourseSubjects.belongsTo(db.Subject, { foreignKey: 'subjectId' });
db.Course.hasMany(db.CourseSubjects, { foreignKey: 'courseId' });
db.Subject.hasMany(db.CourseSubjects, { foreignKey: 'subjectId' });

// --- TeacherSubjects ---
db.TeacherSubjects.belongsTo(db.Teacher, { foreignKey: 'teacherId' });
db.TeacherSubjects.belongsTo(db.Subject, { foreignKey: 'subjectId' });
db.Teacher.hasMany(db.TeacherSubjects, { foreignKey: 'teacherId' });
db.Subject.hasMany(db.TeacherSubjects, { foreignKey: 'subjectId' });


module.exports = db;
