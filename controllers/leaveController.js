const LeaveRequest = require('../models/LeaveRequest');


exports.requestLeave = async (req, res) => {
const payload = req.body;
const l = await LeaveRequest.create(payload);
res.json(l);
};


exports.listLeaves = async (req, res) => {
const list = await LeaveRequest.find().populate('teacher');
res.json(list);
};


exports.setStatus = async (req, res) => {
const { id } = req.params;
const { status, comments } = req.body;
const l = await LeaveRequest.findByIdAndUpdate(id, { status, comments }, { new: true });
res.json(l);
};