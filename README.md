# IS442-G2T2 Clinic Appointment & Queue Management System

## Key Assumptions Made

- Patients are not allowed to reschedule or cancel appointments within 24 hours of the appointment time. Staff are not restricted to this rule.
- Email is only notification channel, so valid patient emails are required.

## Test Accounts

- **Admin**
  - Username: `alice.admin@demo.clinic`
  - Password: `admintest`
- **Staff**
  - Username: `sam.staff@evergreen.clinic`
  - Password: `stafftest`
- **Doctor**
  - Username: `d.tan@evergreen.clinic`
  - Password: `doctortest`
- **Patient**
  - Username: `peter.patient@example.com`
  - Password: `patienttest`

### Dev Login Bypass available in Development Mode

## Architecture Overview

| Layer    | Tech                    | Responsibilities                                                |
| -------- | ----------------------- | --------------------------------------------------------------- |
| Frontend | React 19 + Vite         | Dashboards for each role, REST integration through `/api`.      |
| Backend  | Spring Boot 3 (Java 21) | Appointment rules, queue engine, notification hooks, admin APIs |
| Database | MySQL 8                 | Stores clinics, users, appointments, queue sessions, analytics  |

### Port allocation

- Executable Jar: `http://localhost:8081`
- MySQL: `localhost:3306`

#### Development Environment

- Backend API: `http://localhost:8081`
- Frontend Development Server: `http://localhost:5173` (proxies `/api` to port 8081)
- MySQL: `localhost:3306`

<br>

## Prerequisites

- Java 21
- Node.js 18+ and npm
- Maven
- MySQL 8.x

<br>

## Initial Setup

1. **Create the Database and User (Run Once)**

   ```sql
   CREATE DATABASE clinicdb;
   CREATE USER 'clinic'@'localhost' IDENTIFIED BY 'clinic';
   GRANT ALL PRIVILEGES ON clinicdb.* TO 'clinic'@'localhost';
   FLUSH PRIVILEGES;
   ```

   > If `CREATE USER` reports _Error 1396_, the account already exists. Run only the `GRANT` and `FLUSH` statements.

   <br>

2. **Set Environment Variables**

   Create a `.env` file in `backend` with the following content:

   ```env
   SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
   SENDGRID_FROM_EMAIL=YOUR_SENDGRID_EMAIL
   ```

      <br>

## Running the application

## Backend Setup

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

## WebSocket queue display

- Endpoint: `ws://localhost:8081/ws/queue`
- Payloads: JSON `queue_update` messages with `clinicId`, `total`, `next`, and `queue` arrays.
- Triggered automatically when staff start the queue or call the next patient (future work: broadcast on manual status edits).

## Interactive API docs live at `http://localhost:8081/swagger-ui.html` once the backend is running.

---

## To Note:

To test email notifications, please change backend/src/main/java/com/clinic/application/NotificationService.java line 120's return email to desired email.
