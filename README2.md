# IS442-G2T2 Clinic Appointment & Queue Management System

## Key Assumptions Made

-   Patients are not allowed to reschedule or cancel appointments within 24 hours of the appointment time. Staff are not restricted by this rule.
-   Email is the only notification channel, so valid patient emails are required for notifications to function.

## Test Accounts

### Dev Login Bypass (Available in Development Mode)

-   **Admin**:
    -   Username: `alice.admin@demo.clinic`
    -   Password: `admintest`
-   **Staff**:
    -   Username: `sam.staff@evergreen.clinic`
    -   Password: `stafftest`
-   **Doctor**:
    -   Username: `d.tan@evergreen.clinic`
    -   Password: `doctortest`
-   **Patient**:
    -   Username: `peter.patient@example.com`
    -   Password: `patienttest`

## Architecture Overview

| Layer    | Tech                    | Responsibilities                                                |
| :------- | :---------------------- | :-------------------------------------------------------------- |
| Frontend | React 19 + Vite         | Dashboards for each role, REST integration through `/api`.      |
| Backend  | Spring Boot 3 (Java 21) | Appointment rules, queue engine, notification hooks, admin APIs |
| Database | MySQL 8                 | Stores clinics, users, appointments, queue sessions, analytics  |

### Port Allocation

-   **Backend & Main App**: `http://localhost:8081`
-   **Queue Display**: `http://localhost:4173` (via `npm run preview`)
-   **MySQL**: `localhost:3306`
  
#### Development Environment
-   **Backend**: `http://localhost:8081`
-   **Frontend**: `http://localhost:5173` (via `npm run dev`)
-   **Queue Display**: `http://localhost:5174` (via `npm run dev`)
-   **MySQL**: `localhost:3306`

## Prerequisites

-   Java 21
-   Node.js 18+ and npm
-   Maven
-   MySQL 8.x

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

3.  **Build the Project**
    #### Option 1 (Build Script)
    The build scripts compile the frontend and backend applications into a single executable JAR.

    For macOS / Linux, first make the script executable:
    ```
    chmod +x build.sh
    ```
    Then run the script:
    ```bash
    ./build.sh
    ```

    For Windows, simply run the batch file:
    ```bash
    build.bat
    ```
    The executable JAR will be located in `backend/target/`.

    #### Option 2 (Maven)
    ```
    build.bat
    ```

## Running the Application

The provided run scripts will start the backend server and the queue display server concurrently.

1.  **Ensure your MySQL server is running.**

2.  **Run the Application**

    For macOS / Linux, first make the script executable:
    ```
    chmod +x clinic.sh
    ```
    Then, start the application:
    ```
    ./clinic.sh
    ```

    For Windows, run the batch file:
    ```
    clinic.bat
    ```

3.  **Access the Services**

    Once running, you can access the system at the following addresses:
    -   **Main Clinic Application**: `http://localhost:8081`
    -   **Live Queue Display**: `http://localhost:4173`
    -   **Interactive API Docs**: `http://localhost:8081/swagger-ui.html`

    To stop all services, close the terminal window or press `Ctrl+C`.

---

## Scripts for Your Reference

Below are the contents of the scripts used in the setup.

<details>
<summary><strong>build.sh (for macOS/Linux)</strong></summary>

