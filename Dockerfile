FROM node:20-bookworm-slim

WORKDIR /workspace

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npx", "vite", "--port", "5173"]
