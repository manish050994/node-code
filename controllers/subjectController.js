const Subject = require('../models/Subject');


exports.createSubject = async (req, res) => {
const s = await Subject.create(req.body);
res.json(s);
};


exports.getSubjects = async (req, res) => {
const list = await Subject.find();
res.json(list);
};


exports.updateSubject = async (req, res) => {
const s = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(s);
};


exports.deleteSubject = async (req, res) => {
await Subject.findByIdAndDelete(req.params.id);
res.json({ message: 'Deleted' });
};