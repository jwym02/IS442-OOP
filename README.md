# IS442-OOP Monorepo

This repository contains a Java Spring Boot backend and a Vite + React frontend.

## Structure

- `backend/` — Spring Boot (Maven)
- `frontend/` — Vite + React

## Getting Started

### Backend

```bash
cd backend
# On Unix/Mac
./mvnw spring-boot:run
# On Windows
mvnw.cmd spring-boot:run
```

The backend runs on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests from `/api` to `http://localhost:8080` during development.

## Notes

- CORS is enabled for `http://localhost:5173` in development (see `backend/src/main/java/com/example/demo/config/SecurityConfig.java`).
- Spring Security is configured to permit all requests in development; adjust as needed when adding real auth.
---
# IS442-OOP
5 people group :D

