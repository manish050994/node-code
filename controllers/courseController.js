const Course = require('../models/Course');


exports.createCourse = async (req, res) => {
const c = await Course.create(req.body);
res.json(c);
};


exports.getCourses = async (req, res) => {
const list = await Course.find().populate('subjects');
res.json(list);
};


exports.updateCourse = async (req, res) => {
const c = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(c);
};


exports.deleteCourse = async (req, res) => {
await Course.findByIdAndDelete(req.params.id);
res.json({ message: 'Deleted' });
};