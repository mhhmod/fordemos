# syntax=docker/dockerfile:1
FROM node:22-slim

WORKDIR /app

# OpenSSL is required by Prisma's query engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

# Install ALL dependencies (incl. dev) so the build toolchain — prisma,
# typescript, tailwind — and the tsx-based tenant scripts are available.
# Runtime NODE_ENV=production is set by compose, not baked here, so `npm ci`
# does not omit devDependencies.
COPY package.json package-lock.json* ./
RUN npm ci

# App source, then generate the Prisma client and build.
COPY . .
RUN npm run build

EXPOSE 3000

# Apply migrations against the mounted SQLite volume, then serve.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]
