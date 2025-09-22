// utils\sms.js (updated: placeholder for twilio)
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

exports.sendSms = async ({ to, text }) => {
  await client.messages.create({
    body: text,
    from: process.env.TWILIO_PHONE,
    to,
  });
};