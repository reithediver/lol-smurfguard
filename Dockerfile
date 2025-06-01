# Multi-stage build for League of Legends Smurf Detection App
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd frontend && npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Build backend
RUN npm run build

# Build frontend
RUN cd frontend && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/build ./frontend/build
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# Set up environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node dist/utils/health-check.js || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 