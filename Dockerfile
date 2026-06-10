# syntax=docker/dockerfile:1

###############################################################################
# Elite Zone J — production container for self-hosting (company server)
#
# This is a single Next.js 16 app (storefront + Admin + Studio). It is NOT
# split into separate frontend/backend services — one image runs everything.
#
# Build:   docker build -t elitezonej:latest .
# Run:     docker run -p 3000:3000 --env-file .env.production \
#                 -v ezj_data:/app/data \
#                 -v ezj_uploads:/app/public/uploads \
#                 elitezonej:latest
#
# Native modules (better-sqlite3, sharp) are compiled in the builder stage,
# so the image is platform-specific — build it on/for the target server's
# architecture (linux/amd64 for most servers). See DEPLOY.md.
###############################################################################

ARG NODE_VERSION=22-bookworm-slim

# ---------------------------------------------------------------------------
# Stage 1 — deps: install ALL dependencies (incl. dev) + build native modules
# `sharp` is a devDependency but is required at runtime (next/image + the
# Studio upload route), so we must NOT prune dev deps.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Toolchain for compiling better-sqlite3 / sharp from source if no prebuilt
# binary matches this platform. bookworm-slim ships glibc (sharp's preferred
# libc — see Next.js self-hosting docs on memory allocator).
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2 — builder: compile the Next.js production build (.next)
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so any
# that the company needs must be passed as --build-arg (see DEPLOY.md).
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — runner: minimal-ish runtime. We run `next start` (not standalone
# output) because this app reads files from disk at runtime (lib/admin/*.sql
# schema files, the SQLite DB under data/) and uses an external native module
# — `next start` with the full tree is the robust, known-good path here.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the built application tree from the builder (includes node_modules,
# .next, compiled config, lib/*.sql schema files, db/ migration scripts).
COPY --from=builder /app ./

# Persistent runtime dirs (also mounted as volumes — see run command):
#   /app/data              -> SQLite database (admin.db)
#   /app/public/uploads    -> uploaded images when NOT using Vercel Blob
# Plus .next/cache, which `next start` writes to at runtime (ISR / fetch cache).
# The tree is copied as root, so these must be made writable by the node user.
RUN mkdir -p /app/data /app/public/uploads /app/.next/cache \
    && chown -R node:node /app/data /app/public/uploads /app/.next/cache

USER node

EXPOSE 3000

# Simple container healthcheck (Node 22 has global fetch).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+ (process.env.PORT||3000) +'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
