import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Initialize Logtail if source token is provided
const logtail = process.env.LOGTAIL_SOURCE_TOKEN 
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null;

// Custom format to handle circular references
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length 
    ? JSON.stringify(metadata, (key, value) => {
        // Handle circular references
        if (key === 'req' || key === 'res' || key === 'socket') {
          return '[Circular]';
        }
        return value;
      }, 2) 
    : '';
  return `${timestamp} [${level}]: ${message} ${metaString}`;
});

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    customFormat
  ),
  defaultMeta: { 
    service: 'smurfguard-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '2.0.0'
  },
  transports: [
    // Console transport for local development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        customFormat
      )
    }),
    // File transport for persistent logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add Logtail transport if configured
if (logtail) {
  logger.add(new LogtailTransport(logtail));
  logger.info('Logtail logging initialized');
}

// Add GitHub logging capability
export const logToGitHub = async (
  title: string, 
  body: string, 
  labels: string[] = ['log']
): Promise<{ number: number; html_url: string } | null> => {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    logger.warn('GitHub logging not configured. Missing GITHUB_TOKEN or GITHUB_REPO env variables.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/issues`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          labels
        })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as { number: number; html_url: string };
    logger.info(`Created GitHub issue #${data.number}: ${data.html_url}`);
    return data;
  } catch (error) {
    logger.error('Failed to log to GitHub:', error);
    return null;
  }
};

// Add a method to log critical errors to GitHub
export const logCriticalError = async (error: Error, context: Record<string, any> = {}): Promise<{ number: number; html_url: string } | null> => {
  const title = `[ERROR] ${error.message.substring(0, 80)}`;
  
  const body = `
## Error Details
- **Message**: ${error.message}
- **Stack**: \`\`\`${error.stack}\`\`\`
- **Timestamp**: ${new Date().toISOString()}
- **Environment**: ${process.env.NODE_ENV || 'development'}

## Context
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
`;

  // Log to normal logger
  logger.error('Critical error', { error, context });
  
  // Create GitHub issue for critical errors
  return await logToGitHub(title, body, ['error', 'critical']);
};

export default logger; 