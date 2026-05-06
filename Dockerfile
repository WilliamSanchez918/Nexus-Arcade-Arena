# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM deps AS api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api/src/server.js"]

FROM deps AS web-build
ARG VITE_API_BASE_URL
ARG VITE_IDENTITY_PROVIDER=supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_IDENTITY_PROVIDER=${VITE_IDENTITY_PROVIDER}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
RUN npx vite build --config apps/web/vite.config.js

FROM nginx:1.27-alpine AS web
COPY deploy/nexus/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
