const Attendance = require('../models/Attendance');


exports.markAttendance = async (req, res) => {
const { studentId, date, status } = req.body;
const attendance = await Attendance.findOneAndUpdate(
{ student: studentId, date: new Date(date).toISOString().slice(0,10) },
{ student: studentId, date: new Date(date), status, collegeId: req.user?.collegeId },
{ upsert: true, new: true }
);
res.json(attendance);
};


exports.getAttendance = async (req, res) => {
const q = req.query;
const filter = {};
if (q.student) filter.student = q.student;
if (q.from && q.to) filter.date = { $gte: new Date(q.from), $lte: new Date(q.to) };
const list = await Attendance.find(filter).populate('student');
res.json(list);
};