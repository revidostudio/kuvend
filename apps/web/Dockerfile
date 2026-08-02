FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_CIVIC_API_URL
ARG NEXT_PUBLIC_ISSUER_URL
ARG NEXT_PUBLIC_ASSISTANT_URL
ARG NEXT_PUBLIC_NOTIFICATIONS_URL
ARG NEXT_PUBLIC_SITE_URL
RUN pnpm install --frozen-lockfile && pnpm --filter @kuvend/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@kuvend/web", "start"]
