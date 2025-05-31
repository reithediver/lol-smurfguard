import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupRoutes } from './api/routes';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Verify API key is loaded
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  console.error('ERROR: RIOT_API_KEY not found in environment variables!');
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    console.error('Current .env file content:', envFile);
  } catch (err) {
    console.error('Could not read .env file:', err);
  }
  process.exit(1);
} else {
  console.log('RIOT_API_KEY loaded:', apiKey.slice(0, 10) + '...');
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 