import { Express, Request, Response } from 'express';
import { playerRoutes } from './player.routes';

export const setupRoutes = (app: Express) => {
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // API routes
  app.use('/api/player', playerRoutes);
}; 