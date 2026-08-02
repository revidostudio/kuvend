FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/issuer ./apps/issuer
RUN pnpm install --frozen-lockfile && pnpm --filter @kuvend/issuer build
EXPOSE 4001
CMD ["pnpm", "--filter", "@kuvend/issuer", "start"]
