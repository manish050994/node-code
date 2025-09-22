// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  // Log the full error for debugging
  console.error(err);

  // Determine status code dynamically
  const statusCode = err.statusCode || err.status || 500;

  // Determine error message
  const message = err.message || 'Internal Server Error';

  // Structured error details if provided
  const errorDetails = err.errors || err.error || null;

  // If response formatter middleware is used
  if (res && typeof res.error === 'function') {
    return res.error(errorDetails || message, message, statusCode);
  }

  // Fallback response (if responseFormatter not used)
  res.status(statusCode).json({
    data: null,
    message,
    error: errorDetails,
    status: 0
  });
};
