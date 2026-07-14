import { AppError } from '../utils/errors.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: error.code || 'INTERNAL_ERROR',
    message: statusCode >= 500 ? 'Internal server error' : error.message
  });
};
