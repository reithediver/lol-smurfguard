"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const player_routes_1 = require("./player.routes");
const setupRoutes = (app) => {
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    // API routes
    app.use('/api/player', player_routes_1.playerRoutes);
};
exports.setupRoutes = setupRoutes;
