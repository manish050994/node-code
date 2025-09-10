const Student = require('../models/Student');
const Attendance = require('../models/Attendance');


exports.progressReport = async (req, res) => {
// placeholder: return student + attendance summary
const { studentId } = req.params;
const student = await Student.findById(studentId).populate('course');
const attendanceCount = await Attendance.countDocuments({ student: studentId });
res.json({ student, attendanceCount });
};


exports.attendanceSummary = async (req, res) => {
const { from, to } = req.query;
const pipeline = [
{ $match: { date: { $gte: new Date(from), $lte: new Date(to) } } },
{ $group: { _id: '$student', total: { $sum: 1 } } }
];
const data = await Attendance.aggregate(pipeline);
res.json(data);
};