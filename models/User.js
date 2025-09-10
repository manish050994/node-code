const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true, lowercase: true },
password: { type: String, required: true },
role: { type: String, enum: ['superadmin', 'collegeadmin', 'teacher', 'student'], required: true },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
twoFactorEnabled: { type: Boolean, default: false },
createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('User', userSchema);