"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const player_routes_1 = __importDefault(require("./api/routes/player.routes"));
const errorHandler_1 = require("./utils/errorHandler");
const loggerService_1 = require("./utils/loggerService");
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Verify API key is loaded
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
    console.error('ERROR: RIOT_API_KEY not found in environment variables!');
    try {
        const envFile = fs_1.default.readFileSync('.env', 'utf8');
        console.error('Current .env file content:', envFile);
    }
    catch (err) {
        console.error('Could not read .env file:', err);
    }
    process.exit(1);
}
else {
    console.log('RIOT_API_KEY loaded:', apiKey.slice(0, 10) + '...');
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/player', player_routes_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(port, () => {
    loggerService_1.logger.info(`Server is running on port ${port}`);
});
