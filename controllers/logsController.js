const Log = require('../models/Logs');


exports.listLogs = async (req, res) => {
const list = await Log.find().sort({ at: -1 }).limit(200);
res.json(list);
};