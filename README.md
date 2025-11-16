# IS442-G2T2 Clinic Appointment & Queue Management System

# Github Repository Link: https://github.com/jwym02/IS442-OOP

## Key Assumptions Made

- Patients are not allowed to reschedule or cancel appointments within 24 hours of the appointment time. Staff are not restricted to this rule.
- Email is only notification channel, so valid patient emails are required.

## Test Accounts

### Dev Login Bypass available in Development Mode

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

   Create a `.env` file in `backend/src/main/resources` with the following content:

   ```env
   SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
   SENDGRID_FROM_EMAIL=YOUR_SENDGRID_EMAIL
   ```

   <br>

3. **Build the Backend**

   Navigate to the backend directory and build the project:

   ```bash
   cd backend
   ./mvnw.cmd -DskipTests clean package
   ```

   > The executable JAR will be created in `backend/target/clinic-system-1.0.0.jar`

   <br>

## Running the Application

### Option 1: Using Pre-built JAR (Production)

1. **Ensure MySQL server is running on port 3306**

2. **Start the backend:**

   ```bash
   java -jar backend/target/clinic-system-1.0.0.jar
   ```

   - Flyway migrations execute automatically against `clinicdb`
   - API listens on `http://localhost:8081`
   - Interactive API docs: `http://localhost:8081/swagger-ui.html`

3. **Start the frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   - Frontend dev server: `http://localhost:5173`
   - Vite proxies `/api/*` requests to backend on port 8081

### Option 2: Using Maven (Development)

1. **Ensure MySQL server is running on port 3306**

2. **Start the backend:**

   ```bash
   cd backend
   ./mvnw.cmd spring-boot:run
   ```

   - API listens on `http://localhost:8081`
   - Interactive docs: `http://localhost:8081/swagger-ui.html`

3. **Start the frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   - Frontend dev server: `http://localhost:5173`

### Queue Display Setup

The queue display is a separate WebSocket-powered interface:

```bash
cd queue_display
npm install
npm run dev
```

- Queue display: `http://localhost:5174`
- Connects to WebSocket endpoint: `ws://localhost:8081/ws/queue`
- Displays real-time queue updates with `clinicId`, `total`, `next`, and `queue` data

### Production Frontend Build

For a production build of the frontend:

```bash
cd frontend
npm run build
npm run preview
```

---

## Email Notifications

Email notifications are sent via SendGrid. Configure your API key in the `.env` file (see Initial Setup).

> **Note**: To test with a specific email address, update the recipient email in `backend/src/main/java/com/clinic/application/NotificationService.java`.
