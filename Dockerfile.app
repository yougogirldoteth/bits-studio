FROM node:24-alpine AS base
RUN npm install -g corepack && corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

FROM base AS deps
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/app/package.json packages/app/package.json
RUN pnpm install --frozen-lockfile --filter @bits-collection/app...

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/app packages/app
WORKDIR /app/packages/app
ENV NITRO_PRESET=node-server
RUN pnpm build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/packages/app/.output ./

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]
