FROM node:22-bookworm-slim

WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY package.json http-wrapper.mjs entrypoint.sh ./
RUN npm install --omit=dev && npm cache clean --force
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
