# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

# Copy dependency definitions and lockfile
COPY TransitOps_frontend/vite-project/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY TransitOps_frontend/vite-project/ ./

# Build the production assets
RUN npm run build

# ==========================================
# Stage 2: Build the Spring Boot backend
# ==========================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app

# Copy dependency configuration
COPY TransitOps_backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source files
COPY TransitOps_backend/src ./src

# Copy built frontend assets into Spring Boot static resources
COPY --from=frontend-build /frontend/dist ./src/main/resources/static/

# Compile and package the backend jar (with embedded static assets)
RUN mvn clean package -DskipTests

# ==========================================
# Stage 3: Run Stage (PostgreSQL + JRE)
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install PostgreSQL database, bash, and dos2unix
RUN apk add --no-cache postgresql postgresql-contrib postgresql-client bash dos2unix

# Copy backend compiled jar
COPY --from=backend-build /app/target/*.jar app.jar

# Copy database & application coordinator script
COPY TransitOps_backend/entrypoint.sh .
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

# Expose Web API (8080) and PostgreSQL DB (5432)
EXPOSE 8080 5432

ENTRYPOINT ["./entrypoint.sh"]
