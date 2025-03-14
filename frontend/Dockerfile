# Build stage
FROM node:20.17.0 AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN pnpm install

COPY . .
RUN pnpm run build

# Production stage
FROM node:20.17.0-slim

WORKDIR /app

# Install a simple HTTP server to serve static content
RUN pnpm install -g serve

COPY --from=build /app/dist /app

EXPOSE 3000

# Start the server
CMD ["serve", "-s", ".", "-l", "3000"]