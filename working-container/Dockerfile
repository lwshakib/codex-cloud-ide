FROM oven/bun:latest

# Install Node.js and build tools for node-pty
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    bash \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN bun install

# Copy the rest of the code
COPY . .

# Set workspace directory
ENV WORKSPACE_DIR=/workspace
RUN mkdir -p /workspace

# Expose the agent port
EXPOSE 3001

# Start the agent
CMD ["bun", "run", "index.ts"]
