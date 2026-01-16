# SvelteKit Production Dockerfile
# Railway will use this for the 'folio' service

FROM node:20-alpine AS builder

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the SvelteKit app
RUN pnpm build

# Production stage - minimal image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy built output and package files
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Railway injects PORT automatically, default to 3000
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run the Node adapter output
CMD ["node", "build"]
