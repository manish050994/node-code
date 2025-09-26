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


exports.getUpcomingClass = async (req, res, next) => {
  try {
    const upcoming = await timetableService.getUpcomingClass({ user: req.user });

    if (!upcoming) {
      return res.status(404).json({
        data: null,
        message: 'No upcoming classes found',
        error: null,
        status: 0
      });
    }

    res.json({
      data: upcoming,
      message: 'Upcoming class retrieved successfully',
      error: null,
      status: 1
    });
  } catch (err) {
    next(err);
  }
};

exports.sampleTimetableCsv = async (req, res, next) => {
  try {
    const csv = await timetableService.exportCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('timetable-sample.csv');
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
};

exports.uploadTimetableCsv = async (req, res, next) => {
  try {
    const data = await timetableService.importCsv(req.file.path, req.user.collegeId);
    return res.success(data, 'Timetable uploaded');
  } catch (err) {
    return next(err);
  }
};
