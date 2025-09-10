const mongoose = require('mongoose');


const feeSchema = new mongoose.Schema({
student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
amount: Number,
status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
dueDate: Date,
paidAt: Date,
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
});


module.exports = mongoose.model('Fee', feeSchema);