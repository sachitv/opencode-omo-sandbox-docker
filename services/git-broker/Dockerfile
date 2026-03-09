# syntax=docker/dockerfile:1.20.0

FROM oven/bun:1-slim

WORKDIR /app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
RUN bun install --production

COPY server.ts server.ts
COPY server.test.ts server.test.ts

# Use a dedicated uid so the shared mitm namespace can allow outbound SSH only
# for this broker process and keep that exception away from the workspace. The
# broker runs TypeScript directly under Bun rather than carrying a separate JS
# build artifact.
RUN apt-get update && \
    apt-get install -y --no-install-recommends git openssh-client ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    useradd --uid 10001 --create-home --shell /usr/sbin/nologin broker

USER broker

CMD ["bun", "run", "server.ts"]
