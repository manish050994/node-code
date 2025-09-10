
const mongoose = require('mongoose');
const teacherSchema = new mongoose.Schema({
name: { type: String, required: true },
employeeId: { type: String, required: true, unique: true },
email: String,
subjects: [String],
groups: [String],
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Teacher', teacherSchema);