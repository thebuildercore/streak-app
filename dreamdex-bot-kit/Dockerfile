# DreamDEX bot worker — deploy via Railway template (see docs/railway.md).
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY strategies strategies
COPY advanced advanced
COPY scripts scripts
COPY .env.railway .env

RUN npm ci

ENV NODE_ENV=production

CMD ["node", "scripts/railway-start.mjs"]
