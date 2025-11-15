# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["pnpm", "start"]
