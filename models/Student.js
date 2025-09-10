const mongoose = require('mongoose');


const studentSchema = new mongoose.Schema({
name: { type: String, required: true },
rollNo: { type: String, required: true, unique: true },
course: { type: String, required: true },
year: Number,
section: String,
profilePic: String,
feesPaid: { type: Boolean, default: false },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Student', studentSchema);