FROM node:20-alpine

# Create non-root user
RUN addgroup -S node && adduser -S node -G node 2>/dev/null || true

WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY server.js ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

EXPOSE 5000

USER node

CMD ["node", "server.js"]
