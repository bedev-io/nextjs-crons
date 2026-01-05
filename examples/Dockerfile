# Example Dockerfile for running nextjs-crons in production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install nextjs-crons globally
RUN npm install -g nextjs-crons

# Copy vercel.json configuration
COPY vercel.json .

# Set environment variables
ENV BASE_URL=http://your-nextjs-app:3000
ENV CRON_SECRET=your-secret-here

# Run the cron runner
CMD ["nextjs-crons", "--url", "${BASE_URL}", "--secret", "${CRON_SECRET}", "--verbose"]

# Alternative: Using npm scripts
# COPY package.json package-lock.json ./
# RUN npm ci
# CMD ["npm", "run", "crons"]
