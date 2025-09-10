const Student = require('../models/Student');


exports.createStudent = async (req, res) => {
const payload = req.body;
const student = await Student.create(payload);
res.json(student);
};


exports.getStudents = async (req, res) => {
const q = req.query || {};
const filter = {};
if (q.collegeId) filter.collegeId = q.collegeId;
if (q.course) filter.course = q.course;
const list = await Student.find(filter).populate('course');
res.json(list);
};


exports.getStudent = async (req, res) => {
const s = await Student.findById(req.params.id).populate('course');
if (!s) return res.status(404).json({ message: 'Not found' });
res.json(s);
};


exports.updateStudent = async (req, res) => {
const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(updated);
};


exports.deleteStudent = async (req, res) => {
await Student.findByIdAndDelete(req.params.id);
res.json({ message: 'Deleted' });
};