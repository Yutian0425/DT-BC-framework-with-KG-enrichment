FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm i

# Copy project files
COPY . .

EXPOSE 8545

CMD ["sh", "./start.sh"]