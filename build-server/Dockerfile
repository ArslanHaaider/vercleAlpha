FROM ubuntu:focal

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Create app directory and set permissions
WORKDIR /home/app
RUN mkdir -p /home/app/output && \
    chmod 777 /home/app/output

# Copy files
COPY script.js script.js
COPY package*.json .

# Install dependencies
RUN npm install --no-cache

# Set permissions
RUN chmod +x script.js

# Set the working directory for subsequent commands
WORKDIR /home/app

# Directly run the Node.js script
CMD ["node", "script.js"]