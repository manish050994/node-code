// middlewares/responseFormatter.js
module.exports = (req, res, next) => {
    res.success = (data, message = 'Success') => {
      res.status(200).json({
        data,
        message,
        error: null,
        status: 1
      });
    };
  
    res.error = (error, message = 'Error', statusCode = 500) => {
      res.status(statusCode).json({
        data: null,
        message,
        error,
        status: 0
      });
    };
  
    next();
  };
  