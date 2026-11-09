# The Brightside Project — single container: API server + main site (/) + Studio (/studio/).
# Build:  docker build -t brightside .
# Run:    docker run --env-file .env -p 8080:8080 brightside

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build:app
RUN pnpm prune --prod || true

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
COPY --from=build /app /app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
