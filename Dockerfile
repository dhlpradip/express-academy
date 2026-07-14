# The grader server, containerized — also the day 18 worked example.
FROM node:20-slim

WORKDIR /app

# Dependency layers first: only rebuild when lockfiles change.
COPY package*.json ./
COPY server/package.json server/
COPY client/package.json client/
COPY shared/package.json shared/
RUN npm ci --omit=dev --workspace @academy/server --include-workspace-root

COPY shared/ shared/
COPY server/ server/

EXPOSE 4600
HEALTHCHECK CMD node -e "fetch('http://localhost:4600/api/health').then(r => process.exit(r.ok ? 0 : 1))"
CMD ["npx", "tsx", "server/src/index.ts"]
