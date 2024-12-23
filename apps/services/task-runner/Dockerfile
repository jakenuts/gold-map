# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/data-sources/package.json ./packages/data-sources/
COPY services/task-runner/package.json ./services/task-runner/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/data-sources ./packages/data-sources
COPY services/task-runner ./services/task-runner

# Build packages
RUN pnpm --filter "@gold-map/core" build && \
    pnpm --filter "@gold-map/data-sources" build && \
    pnpm --filter "@gold-map/task-runner" build

# Production stage
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/data-sources/package.json ./packages/data-sources/
COPY services/task-runner/package.json ./services/task-runner/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/data-sources/dist ./packages/data-sources/dist
COPY --from=builder /app/services/task-runner/dist ./services/task-runner/dist

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1

# Start the service
CMD ["node", "services/task-runner/dist/index.js"]
