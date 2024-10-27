FROM node:18-alpine

WORKDIR /app/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV NEXT_PUBLIC_MONGODB_URI=mongodb://root:example@localhost:27017/chatDatabase?authSource=admin

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]