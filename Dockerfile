# Production Dockerfile for SmartFYP Deployment
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies cleanly using Node 20 LTS
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build frontend static assets into dist/
RUN npm run build

# Ensure uploads folder exists
RUN mkdir -p uploads

# Expose application port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
