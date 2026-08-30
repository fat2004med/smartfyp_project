# Production Dockerfile for SmartFYP Deployment
FROM node:20-alpine

WORKDIR /app

# Install all dependencies required for building the application
COPY package*.json ./
RUN npm ci --include=dev --legacy-peer-deps || npm install --include=dev --legacy-peer-deps

# Copy application source code
COPY . .

# Build frontend static assets into dist/
RUN npm run build

# Set production environment for runtime
ENV NODE_ENV=production
ENV PORT=3000

# Ensure uploads folder exists
RUN mkdir -p uploads

# Expose application port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
