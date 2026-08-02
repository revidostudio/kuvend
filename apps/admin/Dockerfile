FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ui ./packages/ui
COPY apps/admin ./apps/admin
RUN pnpm install --frozen-lockfile && pnpm --filter @kuvend/admin build
EXPOSE 4003
CMD ["pnpm", "--filter", "@kuvend/admin", "start"]
