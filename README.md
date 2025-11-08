# IS442-G2T2 Clinic Appointment & Queue Management System

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

3. **Build the project**

   Run the build script to compile and package the application:

   ```bash
   build.sh
   ```

   > Executable jar outputs to backend/target

   <br>

## Running the application

1. **Make sure the MySQL server is running on port 3306.**
   
2. **Start the application using the generated JAR file:**
   ```jar
   java -jar <your-jar-file>.jar
   ```


<!-- 2. **Build & run the API**

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

--- -->
