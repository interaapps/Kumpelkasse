# Build stage
FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app

COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew ./

RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || true

COPY src ./src

RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]