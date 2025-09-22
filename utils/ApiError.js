// utils/ApiError.js
class ApiError extends Error {
  constructor(status, message, error = null) {
    super(message);
    this.status = status;
    this.error = error || message;
  }

  static badRequest(message = 'Bad Request', error = null) {
    return new ApiError(400, message, error);
  }
  static unauthorized(message = 'Unauthorized', error = null) {
    return new ApiError(401, message, error);
  }
  static forbidden(message = 'Forbidden', error = null) {
    return new ApiError(403, message, error);
  }
  static notFound(message = 'Not Found', error = null) {
    return new ApiError(404, message, error);
  }
  static conflict(message = 'Conflict', error = null) {
    return new ApiError(409, message, error);
  }
  static internal(message = 'Internal Server Error', error = null) {
    return new ApiError(500, message, error);
  }
}

module.exports = ApiError;
