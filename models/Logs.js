const mongoose = require('mongoose');


const logSchema = new mongoose.Schema({
actor: String,
action: String,
target: String,
meta: Object,
at: { type: Date, default: Date.now },
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
});


module.exports = mongoose.model('Log', logSchema);