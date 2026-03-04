# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for build
# Ignore prepare script to skip husky in container
RUN npm install --ignore-scripts && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_APP_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install dumb-init for proper signal handling and openssl for envsubst
RUN apk add --no-cache dumb-init openssl

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Cloud Run sets PORT environment variable, default to 8080
ENV PORT=8080
ENV NODE_ENV=production
ENV BACKEND_URL=${BACKEND_URL:-backend-pos-508482854424.us-central1.run.app}

# Expose the port
EXPOSE $PORT

# Health check for nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080 || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Substitute environment variables in nginx config and start nginx
CMD /bin/sh -c "envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
