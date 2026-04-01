# Shikola Frontend Dockerfile
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY frontend/public /var/www/shikola/public
COPY frontend/shared /var/www/shikola/shared
COPY frontend/assets /var/www/shikola/assets
COPY frontend/shared-assets /var/www/shikola/shared-assets
COPY frontend/styles.css /var/www/shikola/styles.css
COPY *.html /var/www/shikola/
COPY *.js /var/www/shikola/
COPY *.png /var/www/shikola/
COPY *.jpg /var/www/shikola/
COPY *.svg /var/www/shikola/
COPY *.ico /var/www/shikola/

# Copy portal directories
COPY frontend/portals/school-admin /var/www/shikola/school-admin/
COPY frontend/portals/teacher-portal /var/www/shikola/teacher-portal/
COPY frontend/portals/pupil-portal /var/www/shikola/pupil-portal/
COPY frontend/portals/super-admin /var/www/shikola/super-admin/
COPY frontend/portals/accountant-portal /var/www/shikola/accountant-portal/

# Set proper permissions
RUN chown -R nginx:nginx /var/www/shikola && \
    chmod -R 755 /var/www/shikola

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
