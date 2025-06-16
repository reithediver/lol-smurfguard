"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = exports.performanceMonitor = void 0;
const loggerService_1 = __importDefault(require("./loggerService"));
class PerformanceMonitor {
    constructor() {
        this.requestTimes = [];
        this.requestTimestamps = [];
        this.metrics = {
            requestCount: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            errors: 0,
            successfulRequests: 0,
            requestsPerMinute: 0,
            slowQueries: 0,
            lastReset: new Date()
        };
        // Reset metrics every hour
        setInterval(() => this.resetMetrics(), 60 * 60 * 1000);
    }
    // Middleware to track request performance
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const startHrTime = process.hrtime();
            // Override res.end to capture response time
            const originalEnd = res.end;
            res.end = function (chunk, encoding) {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const preciseTime = process.hrtime(startHrTime);
                const preciseMs = preciseTime[0] * 1000 + preciseTime[1] / 1e6;
                // Update metrics
                exports.performanceMonitor.recordRequest(responseTime, res.statusCode >= 400);
                // Log slow requests
                if (responseTime > 1000) {
                    loggerService_1.default.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
                }
                // Log request details
                loggerService_1.default.info(`${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
                return originalEnd.call(this, chunk, encoding);
            };
            next();
        };
    }
    recordRequest(responseTime, isError) {
        this.metrics.requestCount++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;
        if (isError) {
            this.metrics.errors++;
        }
        else {
            this.metrics.successfulRequests++;
        }
        if (responseTime > 1000) {
            this.metrics.slowQueries++;
        }
        // Track request times for more detailed analysis
        this.requestTimes.push(responseTime);
        this.requestTimestamps.push(Date.now());
        // Keep only last 1000 requests in memory
        if (this.requestTimes.length > 1000) {
            this.requestTimes.shift();
            this.requestTimestamps.shift();
        }
        this.calculateRequestsPerMinute();
    }
    calculateRequestsPerMinute() {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        const recentRequests = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
        this.metrics.requestsPerMinute = recentRequests.length;
    }
    getMetrics() {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const cpuUsage = process.cpuUsage();
        return {
            ...this.metrics,
            memoryUsage,
            uptime,
            cpuUsage
        };
    }
    getDetailedStats() {
        if (this.requestTimes.length === 0) {
            return {
                min: 0,
                max: 0,
                median: 0,
                p95: 0,
                p99: 0
            };
        }
        const sorted = [...this.requestTimes].sort((a, b) => a - b);
        const length = sorted.length;
        return {
            min: sorted[0],
            max: sorted[length - 1],
            median: sorted[Math.floor(length / 2)],
            p95: sorted[Math.floor(length * 0.95)],
            p99: sorted[Math.floor(length * 0.99)]
        };
    }
    resetMetrics() {
        loggerService_1.default.info('Resetting performance metrics');
        this.metrics = {
            requestCount: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            errors: 0,
            successfulRequests: 0,
            requestsPerMinute: 0,
            slowQueries: 0,
            lastReset: new Date()
        };
        this.requestTimes = [];
        this.requestTimestamps = [];
    }
    // Get metrics in Prometheus format (for monitoring integrations)
    getPrometheusMetrics() {
        const metrics = this.getMetrics();
        const stats = this.getDetailedStats();
        return `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requestCount}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} ${this.requestTimes.filter(t => t <= 100).length}
http_request_duration_seconds_bucket{le="0.5"} ${this.requestTimes.filter(t => t <= 500).length}
http_request_duration_seconds_bucket{le="1.0"} ${this.requestTimes.filter(t => t <= 1000).length}
http_request_duration_seconds_bucket{le="+Inf"} ${this.requestTimes.length}

# HELP http_request_errors_total Total number of HTTP request errors
# TYPE http_request_errors_total counter
http_request_errors_total ${metrics.errors}

# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="rss"} ${metrics.memoryUsage.rss}
memory_usage_bytes{type="heapTotal"} ${metrics.memoryUsage.heapTotal}
memory_usage_bytes{type="heapUsed"} ${metrics.memoryUsage.heapUsed}
    `.trim();
    }
}
// Singleton instance
exports.performanceMonitor = new PerformanceMonitor();
// Export middleware function
exports.performanceMiddleware = exports.performanceMonitor.middleware();
