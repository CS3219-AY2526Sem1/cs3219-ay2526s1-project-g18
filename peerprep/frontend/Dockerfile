FROM node:20-bullseye-slim

WORKDIR /src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx next build
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]