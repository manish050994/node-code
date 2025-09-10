const mongoose = require('mongoose');


const courseSchema = new mongoose.Schema({
code: { type: String, required: true, unique: true },
name: { type: String, required: true },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
});


module.exports = mongoose.model('Course', courseSchema);