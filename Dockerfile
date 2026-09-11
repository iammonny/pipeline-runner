# The deployable artifact. Built once by Jenkins, scanned by Aikido, promoted unchanged to prod.
FROM node:22-alpine

WORKDIR /app

# Copy the manifests first so Docker can cache the dependency layer.
COPY package.json package-lock.json ./
# Production install only: dev dependencies (eslint) never ship.
RUN npm ci --omit=dev

COPY server.js ./
COPY src ./src
COPY public ./public

# Do not run as root inside the container.
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
