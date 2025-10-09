# Multi-stage Dockerfile for Vue ERP UI

FROM node:22.13-slim AS base
WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN --mount=type=ssh npm ci || npm install
COPY . .
RUN npm run build

FROM node:22.13-alpine AS runtime
WORKDIR /app
RUN apk update && apk upgrade
COPY --from=base --chown=node:node /app .
RUN chown -R node:node /app
ENV NODE_ENV=production PORT=3000
USER node

EXPOSE 3000

# If this UI has a Node server entry point use it; otherwise build static and serve with a simple server
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://localhost:${PORT}/ || exit 1
CMD ["npm","run","start"]


