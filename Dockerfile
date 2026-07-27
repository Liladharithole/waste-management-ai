# Base image
FROM node:22-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /usr/src/app
COPY package*.json ./
# Use --ignore-scripts so postinstall doesn't fail before source/prisma files are copied
RUN npm ci --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Run prebuild to generate both Prisma clients and build the app
RUN npm run prebuild
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./
COPY --from=builder /usr/src/app/prisma-central-core.config.ts ./
COPY --from=builder /usr/src/app/tsconfig.json ./

EXPOSE 7001

CMD ["npm", "run", "start:prod"]
