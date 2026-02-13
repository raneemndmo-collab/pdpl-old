# ─── Single Stage Build for Railway ───────────────────
FROM node:22-alpine

WORKDIR /app

# Install pnpm via npm (avoids corepack issues)
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend + backend
RUN pnpm build

# Prune dev dependencies after build
RUN pnpm prune --prod

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-3000}

# Start the server
CMD ["node", "dist/index.js"]
