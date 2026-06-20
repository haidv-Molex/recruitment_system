# ==============================================================================
# STAGE 1: Build Stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Declare build argument for backend API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the React + Vite application
RUN npm run build

# ==============================================================================
# STAGE 2: Production Stage (Nginx Web Server)
# ==============================================================================
FROM nginx:1.25-alpine

# Remove default configuration and static page
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (HTTP)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
