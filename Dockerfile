# Multi-stage build for MAIA Vue AI Example
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server files and source code
COPY server.js ./
COPY src/ ./src/

# Create test directory to satisfy pdf-parse
RUN mkdir -p test/data && echo "dummy" > test/data/05-versions-space.pdf

# Create necessary directories
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["node", "server.js"] 