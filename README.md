# IS442-G2T2 Clinic Appointment & Queue Management System

## Architecture Overview

| Layer    | Tech                    | Responsibilities                                                |
| -------- | ----------------------- | --------------------------------------------------------------- |
| Frontend | React 19 + Vite         | Dashboards for each role, REST integration through `/api`.      |
| Backend  | Spring Boot 3 (Java 21) | Appointment rules, queue engine, notification hooks, admin APIs |
| Database | MySQL 8                 | Stores clinics, users, appointments, queue sessions, analytics  |

Port allocation:

- Backend API: `http://localhost:8081`
- Frontend dev server: `http://localhost:5173` (proxies `/api` to port 8081)

---

## Prerequisites

- Java 21
- Node.js 18+ and npm
- Maven
- MySQL 8.x

---

## Backend Setup

1. **Create the schema (run once)**

   ```sql
   CREATE DATABASE clinicdb;
   CREATE USER 'clinic'@'localhost' IDENTIFIED BY 'clinic';
   GRANT ALL PRIVILEGES ON clinicdb.* TO 'clinic'@'localhost';
   FLUSH PRIVILEGES;
   ```

   > If `CREATE USER` reports _Error 1396_, the account already exists. Run only the `GRANT` and `FLUSH` statements.

2. **Build & run the API**

   ```powershell
   cd backend
   ./mvnw.cmd -DskipTests clean package
   ./mvnw.cmd spring-boot:run
   ```

   - Flyway migrations execute automatically against `clinicdb`.
   - The API listens on `http://localhost:8081`.
   - Interactive docs: `http://localhost:8081/swagger-ui.html`.

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
# Frontend dev server: http://localhost:5173
```

During development Vite proxies `/api/*` requests to the backend on port 8081 (see `vite.config.js`). For a production build:

```powershell
npm run build
npm run preview
```

---
