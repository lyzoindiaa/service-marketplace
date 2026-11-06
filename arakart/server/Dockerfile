# ==========================================
# AraKart Server Multi-Stage Dockerfile
# ==========================================

# 1. Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and server package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --workspace=server

# Copy server source code and config
COPY server/ ./server/

# Build TypeScript to dist
RUN npm run build --workspace=server

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --workspace=server --omit=dev

# Copy compiled files from builder stage
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 5000

# Run compiled server
CMD ["node", "server/dist/index.js"]
