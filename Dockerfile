# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom and src
COPY pom.xml .
COPY src ./src

# Copy local jar
COPY src/main/resources/libs/fastcgi-lib.jar ./libs/fastcgi-lib.jar

# Install the local jar into the image's Maven repository
RUN mvn install:install-file \
    -Dfile=libs/fastcgi-lib.jar \
    -DgroupId=com.ifmo.se \
    -DartifactId=fastcgi-lib \
    -Dversion=1.0 \
    -Dpackaging=jar

# Build the project
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the  .jar
COPY --from=build /app/target/Web_Lab1-1.0-SNAPSHOT-jar-with-dependencies.jar ./app.jar

# Expose port
EXPOSE 1447

# Run the app and set the FastCGI port
CMD ["java", "-DFCGI_PORT=1447", "-jar", "app.jar"]