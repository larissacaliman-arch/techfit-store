FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 80
LABEL version="1.0" description="TechFit Store - E-commerce Site"
