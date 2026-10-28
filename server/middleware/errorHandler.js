export function errorHandler(err, req, res, next) {
  console.error('[API Error]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(statusCode).json({
    error: message,
    statusCode,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
