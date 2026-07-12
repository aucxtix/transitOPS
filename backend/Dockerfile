FROM node:20-slim

# Install sqlite build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Run db seeder
RUN npm run seed

EXPOSE 8000

CMD ["npm", "start"]
