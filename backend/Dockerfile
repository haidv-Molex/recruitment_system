# ==============================================================================
# STAGE 1: Build Stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build/Compile the TypeScript codebase to the dist/ folder (using ts-patch / tspc)
RUN npm run build

# Remove development dependencies to optimize production image size
RUN npm prune --production

# ==============================================================================
# STAGE 2: Production Stage
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Copy configurations and metadata
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ecosystem.config.cjs ./
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/utilities ./utilities

# Install pm2 globally for cluster management inside the container
RUN npm install -g pm2

# Expose the application port (defaults to 3000)
EXPOSE 3000

ENV NODE_ENV=production

# Start application using PM2 in runtime mode (optimized for Docker containers)
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
