import { Request, Response, NextFunction } from 'express';
import { logger } from './loggerService';

export class AppError extends Error {
    constructor(public message: string, public statusCode: number) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const createError = (statusCode: number, message: string): AppError => {
    return new AppError(message, statusCode);
};

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error:', err);

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