FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/civic-api ./apps/civic-api
COPY packages/contracts ./packages/contracts
COPY packages/credential ./packages/credential
COPY packages/privacy-testkit ./packages/privacy-testkit
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kuvend/credential build && pnpm --filter @kuvend/civic-api build
CMD ["pnpm", "--filter", "@kuvend/civic-api", "start"]
