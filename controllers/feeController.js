const Fee = require('../models/Fee');


exports.createFee = async (req, res) => {
const f = await Fee.create(req.body);
res.json(f);
};


exports.getFees = async (req, res) => {
const list = await Fee.find().populate('student').populate('course');
res.json(list);
};


exports.payFee = async (req, res) => {
const { id } = req.params;
const f = await Fee.findByIdAndUpdate(id, { status: 'paid', paidAt: new Date() }, { new: true });
res.json(f);
};