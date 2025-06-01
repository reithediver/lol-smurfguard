"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class ConsoleLoggerService {
    info(message, ...args) {
        console.log(`[INFO] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    }
    debug(message, ...args) {
        console.debug(`[DEBUG] ${message}`, ...args);
    }
}
exports.logger = new ConsoleLoggerService();
