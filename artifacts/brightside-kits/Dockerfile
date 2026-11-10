# The Brightside Wellness Project kits site — static build served by nginx.
# Build from the repository root so the pnpm workspace is available:
#   docker build -f artifacts/brightside-kits/Dockerfile -t brightside-kits .
# Pass the API that receives order-form submissions (the main hub's URL):
#   docker build -f artifacts/brightside-kits/Dockerfile \
#     --build-arg VITE_API_BASE_URL=https://thebrightsidehub-480156548115.us-east1.run.app \
#     -t brightside-kits .
# Run:  docker run -p 8080:8080 brightside-kits

FROM node:24-bookworm-slim AS build
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY artifacts/brightside-kits ./artifacts/brightside-kits
RUN pnpm install --frozen-lockfile --filter @workspace/brightside-kits
RUN pnpm --filter @workspace/brightside-kits run build

FROM nginx:1.27-alpine
COPY artifacts/brightside-kits/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/artifacts/brightside-kits/dist/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
