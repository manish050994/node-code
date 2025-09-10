const mongoose = require('mongoose');


const subjectSchema = new mongoose.Schema({
code: { type: String, required: true },
name: { type: String, required: true },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
});


module.exports = mongoose.model('Subject', subjectSchema);