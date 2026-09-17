/**
 * Application Error Classes
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, code = "bad_request") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", code = "unauthorized") {
    super(message, 401, code);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", code = "forbidden") {
    super(message, 403, code);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "not_found") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}
