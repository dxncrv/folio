# SvelteKit Production Dockerfile
# Railway will use this for the 'folio' service

# 1. Base stage: Configure pnpm
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# 2. Prod Deps stage: Install only production dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 3. Builder stage: Build the application
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 4. Runtime stage: Minimal image for production
FROM base AS runtime
WORKDIR /app

# Copy production node_modules from prod-deps
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built app and package.json from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Railway injects PORT automatically, default to 3000
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run the Node adapter output
CMD ["node", "build"]
