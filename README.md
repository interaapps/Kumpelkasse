# Kumpelkasse

Kumpelkasse is a full-stack app for tracking debts in friend groups, shared apartments, trips, and games such as poker or blackjack.

This repository contains:

- `app/`: React Native + Expo app using Expo Router
- `api/`: Kotlin + Spring Boot API with MySQL, JPA, and server-side debt calculation

## Features

- Multiple groups per user
- Direct debts, splits, one-off expenses, and games
- Optimized settlement transfers between members
- Payment tracking with references to the debts that were settled
- User profiles with payment details
- Password login and InteraApps OIDC login
- Deep links and invite links for `kumpelkasse.interaapps.de`
- Dark mode, push notifications, and background refresh

## Project Structure

```txt
.
├── api/   # Spring Boot backend
└── app/   # Expo / React Native frontend
```

## Requirements

### General

- Node.js 20+
- Java 21
- MySQL 8+

### iOS

- Xcode version compatible with Expo SDK 55

### Android

- Android Studio / Android SDK

## Local Development

### 1. Start the backend

```bash
cd api
./gradlew bootRun
```

By default, the API runs on `http://localhost:8080`.

Important defaults from `api/src/main/resources/application.properties`:

- `SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/mydatabase?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `SPRING_DATASOURCE_USERNAME=myuser`
- `SPRING_DATASOURCE_PASSWORD=secret`
- `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- `APP_PUBLIC_BASE_URL=https://kumpelkasse.interaapps.de`

### 2. Start the frontend

```bash
cd app
npm install
npm run start
```

Other useful commands:

- `npm run ios`
- `npm run android`
- `npm run web`

## Frontend API Connection

The frontend uses the following default logic:

- Expo Go on a local network: `http://<your-metro-host>:8080/api`
- Local iOS: `http://localhost:8080/api`
- Android emulator: `http://10.0.2.2:8080/api`
- Production: `https://kumpelkasse.interaapps.de/api`

You can override the API URL explicitly:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080/api
```

Other relevant frontend variables:

- `EXPO_PUBLIC_INTERAAPPS_CLIENT_ID`

## OIDC / InteraApps

Backend:

- `INTERAAPPS_OIDC_CLIENT_ID`
- `INTERAAPPS_OIDC_CLIENT_SECRET`

Frontend:

- uses InteraApps OIDC through Expo Auth Session
- app scheme: `kumpelkasse://`

## Deep Links and Invites

The app is configured for:

- App scheme: `kumpelkasse://`
- Universal links: `https://kumpelkasse.interaapps.de/invite/...`

The backend also serves the required well-known endpoints:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

## Tests

### Backend

```bash
cd api
./gradlew test
```

### Frontend typecheck

```bash
cd app
npx tsc --noEmit
```

## API Documentation

When the backend is running:

- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Build / Release

### Expo / App

`app/eas.json` includes these profiles:

- `development`
- `preview`
- `production`

Example:

```bash
cd app
eas build --platform ios --profile production
```

### Backend

```bash
cd api
./gradlew build
```

## Architecture

### Frontend

- Expo Router with tab navigation
- global dashboard store
- Axios for API calls
- local session handling with a Bearer token
- Safe Area support, dark mode, and iOS-oriented UI

### Backend

- Spring Boot 3
- Kotlin
- JPA / Hibernate
- MySQL
- server-side calculation for balances, settlements, and optimized transfers

## Notes

- The actual debt logic lives in the backend.
- The frontend uses preview event lists and paginated event feeds in some places, so summaries and statistics should come from backend-calculated data.
- Group joining is currently still based on `groupId` and is not yet protected by signed invite tokens.
