# JobTrack - Smart Job Application Tracking System
React + Vite  ->  REST  ->  Spring Boot (JPA/Hibernate)  ->  MySQL

## Prerequisites
Java 17+, Maven 3.8+, Node 18+, MySQL 8 running on localhost:3306.

## 1. Backend (http://localhost:8080)
The `jobtrack` database and tables are created automatically on first run.
```bash
cd backend
# Windows PowerShell: $env:DB_PASSWORD="your_mysql_password"
export DB_USER=root DB_PASSWORD=your_mysql_password
mvn spring-boot:run
```
Demo data and a demo user (demo@jobtrack.com / demo123) are inserted when the tables are empty.
Set `jobtrack.seed=false` in `application.properties` to start with an empty database.

## 2. Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
Point the UI at a different backend with `VITE_API_URL=http://host:port`.

## REST API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /applications?q=&status=&sort=newest\|oldest\|company | List, search, filter, sort |
| POST | /applications | Add application |
| PUT | /applications/{id} | Edit application |
| DELETE | /applications/{id} | Delete application |
| GET | /applications/stats | Dashboard statistics + monthly counts |
| GET / POST | /users | List / register users (BCrypt-hashed passwords) |
| POST | /users/login | Sign in |

## Database
- `users`: id, name, email (unique), password
- `applications`: id, company, position, status, location, salary, applied_date

## Quick API test
```bash
curl -X POST localhost:8080/applications -H 'Content-Type: application/json' \
  -d '{"company":"Acme","position":"Dev","status":"Applied","location":"Remote","salary":"20 LPA"}'
curl localhost:8080/applications/stats
```

## Pages
Dashboard, Kanban Board (drag & drop), Applications (search/filter/sort/edit), Interviews (schedule + prep notes),
Analytics (funnel, weekly activity, locations, smart insights), Profile (edit name, change password, dark mode, CSV export).
New API: `PUT /users/{id}`. Applications now also store `interviewDate` and `notes`
(columns are added automatically by Hibernate `ddl-auto=update`).
