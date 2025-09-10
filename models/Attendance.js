const mongoose = require('mongoose');


const attendanceSchema = new mongoose.Schema({
student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
date: { type: Date, required: true },
status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
});


attendanceSchema.index({ student: 1, date: 1 }, { unique: true });


module.exports = mongoose.model('Attendance', attendanceSchema);