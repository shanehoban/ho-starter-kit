FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
COPY . .
ARG NODE_BUILD_MEMORY_MB=1280
RUN NODE_OPTIONS=--max-old-space-size=${NODE_BUILD_MEMORY_MB} pnpm build && pnpm prune --prod

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV CI=true
RUN apk add --no-cache bash && corepack enable && corepack prepare pnpm@11.5.3 --activate
COPY --from=build /app .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3000}/`).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["sh", "-lc", "pnpm db:deploy-migrate && node .output/server/index.mjs"]
