FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/notifications ./apps/notifications
RUN pnpm install --frozen-lockfile && pnpm --filter @kuvend/notifications build
EXPOSE 4004
CMD ["pnpm", "--filter", "@kuvend/notifications", "start"]
