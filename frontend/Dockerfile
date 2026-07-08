FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PUBLIC_URL=/ege_calc
ENV REACT_APP_API_BASE_URL=/ege-calc-backend/api

RUN npm run build


FROM nginx:1.27-alpine

COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]