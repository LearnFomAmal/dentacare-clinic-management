import { env } from '../config/env.js' // Import your config

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // Use the validated env object here
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  })
}