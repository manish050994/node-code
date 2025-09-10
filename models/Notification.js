const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
title: String,
message: String,
channels: [String], // ['email','sms','whatsapp','push']
target: { type: String, default: 'all' },
meta: Object,
sentAt: Date,
collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
});


module.exports = mongoose.model('Notification', notificationSchema);