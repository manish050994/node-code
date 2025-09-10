const Teacher = require('../models/Teacher');


exports.createTeacher = async (req, res) => {
const teacher = await Teacher.create(req.body);
res.json(teacher);
};


exports.getTeachers = async (req, res) => {
const list = await Teacher.find();
res.json(list);
};


exports.updateTeacher = async (req, res) => {
const t = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(t);
};


exports.deleteTeacher = async (req, res) => {
await Teacher.findByIdAndDelete(req.params.id);
res.json({ message: 'Deleted' });
};