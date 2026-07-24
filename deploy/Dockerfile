# syntax=docker/dockerfile:1
FROM node:22-slim

WORKDIR /app

# OpenSSL is required by Prisma's query engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install dependencies against the lockfile first for cacheable layers.
COPY package.json package-lock.json* ./
RUN npm ci

# App source, then generate the Prisma client and build.
COPY . .
RUN npm run build

EXPOSE 3000

# Apply migrations against the mounted SQLite volume, then serve.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]
