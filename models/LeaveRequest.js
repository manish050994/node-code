const mongoose = require('mongoose');


const leaveSchema = new mongoose.Schema({
teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
from: Date,
to: Date,
reason: String,
status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
comments: String,
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('LeaveRequest', leaveSchema);