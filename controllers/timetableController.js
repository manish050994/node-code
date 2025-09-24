// New controller: controllers\timetableController.js
const timetableService = require('../services/timetableService');

exports.createTimetable = async (req, res, next) => {
  try {
    const t = await timetableService.createTimetable(req.body, req.user.collegeId);
    return res.success(t, 'Timetable created');
  } catch (err) {
    return next(err);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const list = await timetableService.getTimetable(req.user);
    return res.success(list, 'Timetable fetched');
  } catch (err) {
    return next(err);
  }
};