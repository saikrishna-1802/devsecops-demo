# ✅  SECURE DOCKERFILE — Production-ready
#
# Fixes applied:
#   1. Pinned to a specific minimal image version
#   2. Runs as non-root user (appuser)
#   3. Only copies what is needed
#   4. Health check defined
#   5. Only exposes the required port

FROM node:20-alpine

# ✅ Create a non-root user to run the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# ✅ Copy package files first (better Docker layer caching)
COPY package*.json ./

# ✅ Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ✅ Copy only the source code — not .env, .git, secrets
COPY src/ ./src/

# ✅ Switch to non-root user before running anything
USER appuser

# ✅ Only expose the app port
EXPOSE 3000

# ✅ Health check so orchestrators know if the app is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.fixed.js"]
