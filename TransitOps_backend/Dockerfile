# Build stage
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install PostgreSQL and bash
RUN apk add --no-cache postgresql postgresql-contrib postgresql-client bash

COPY --from=build /app/target/*.jar app.jar
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8080 5432

ENTRYPOINT ["./entrypoint.sh"]

