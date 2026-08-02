FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/assistant ./apps/assistant
RUN pnpm install --frozen-lockfile && pnpm --filter @kuvend/assistant build
EXPOSE 4002
CMD ["pnpm", "--filter", "@kuvend/assistant", "start"]
