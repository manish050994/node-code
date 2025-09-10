const mongoose = require('mongoose');


const collegeSchema = new mongoose.Schema({
name: { type: String, required: true },
code: { type: String, required: true, unique: true },
address: String,
status: { type: Boolean, default: true },
createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('College', collegeSchema);