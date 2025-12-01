FROM node:22

# Create app directory
WORKDIR /app

# Install deps first (cache-friendly)
COPY package*.json ./
RUN npm install && npm install -g esbuild && npm install -D @tailwindcss/postcss
RUN npm install express
RUN npm install axios
RUN npm install -D @types/axios

# Copy source
COPY tailwind.config.js postcss.config.js .
COPY . .

# Build the Vite project
RUN chmod -R 755 node_modules && npm run build

# Expose frontend port
EXPOSE 3001

# Run the preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3001"]