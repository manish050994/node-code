// server.js (modified: added new routes, multer)
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const teacherLeaveRoutes = require('./routes/teacherLeaveRoutes');
const reportRoutes = require('./routes/reportRoutes');
const logsRoutes = require('./routes/logsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const parentRoutes = require('./routes/parentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const markRoutes = require('./routes/markRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const messageRoutes = require('./routes/messageRoutes');
const studentLeaveRoutes = require('./routes/studentLeaveRoutes');
const examRoutes = require('./routes/examRoutes');

const errorHandler = require('./middlewares/errorHandler');
const responseFormatter = require('./middlewares/responseFormatter');
const { connectDB } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(responseFormatter);
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));
app.use('/studentProfile', express.static(path.join(__dirname, 'studentProfile')));
app.use('/teacherProfile', express.static(path.join(__dirname, 'teacherProfile')));
app.use('/collegeProfile', express.static(path.join(__dirname, 'collegeProfile')));
app.use('/parentProfile', express.static(path.join(__dirname, 'parentProfile')));
app.use('/collegeProfile/signature', express.static(path.join(__dirname, 'collegeProfile/signature')));
app.use('/collegeProfile/stamp', express.static(path.join(__dirname, 'collegeProfile/stamp')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teacher-leaves', teacherLeaveRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/student-leaves', studentLeaveRoutes);
app.use('/api/exams', examRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server', err);
  });