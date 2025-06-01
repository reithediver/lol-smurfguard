"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.createError = exports.AppError = void 0;
const loggerService_1 = require("./loggerService");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const createError = (statusCode, message) => {
    return new AppError(message, statusCode);
};
exports.createError = createError;
const errorHandler = (err, req, res, next) => {
    loggerService_1.logger.error('Error:', err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
