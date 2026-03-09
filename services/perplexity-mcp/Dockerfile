FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json http-wrapper.mjs ./
RUN npm install --omit=dev && npm cache clean --force

CMD ["node", "http-wrapper.mjs"]
