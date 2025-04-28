# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]