# Fetch the LiteFS binary using a multi-stage build.
FROM flyio/litefs:0.5 AS litefs

FROM node:20-bookworm-slim as base

RUN apt update
RUN apt install -y ca-certificates fuse3

# Install all node_modules, including dev dependencies
FROM base AS deps

RUN mkdir /app
WORKDIR /app

COPY package.json ./
RUN npm install

# Setup production node_modules
FROM base AS production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json ./
RUN npm prune --prod

# Build the app
FROM base AS build

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .
RUN npm run build

# Build the production image with minimal footprint
FROM base

ENV FLY="true"
ENV LITEFS_DIR="/litefs"
ENV DATABASE_FILENAME="sqlite.db"
ENV DATABASE_URL="$LITEFS_DIR/$DATABASE_FILENAME"
ENV INTERNAL_PORT="8080"
ENV PORT="8081"
ENV NODE_ENV=production

WORKDIR /app

# Setup LiteFS
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/public /app/public
COPY --from=litefs /usr/local/bin/litefs /usr/local/bin/litefs
ADD litefs.yml /etc/litefs.yml
RUN mkdir -p /data ${LITEFS_DIR}

ADD . .

EXPOSE 3000

CMD ["litefs", "mount"]
