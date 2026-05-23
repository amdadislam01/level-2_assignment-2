# ⚡ DevPulse – Internal Tech Issue & Feature Tracker

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

DevPulse is a high-performance, developer-focused collaborative platform designed for engineering teams to report bugs, suggest features, and track technical resolutions. 

This application features a highly secure Role-Based Access Control (RBAC) authentication system, a modular routing architecture, and a fully relational PostgreSQL database backend leveraging **native raw SQL queries** (completely ORM-free) for raw performance.

---

### 🌐 Deployment Links
* **Live API Deployment:** [https://level-2-assignment-2-gilt.vercel.app/](https://level-2-assignment-2-gilt.vercel.app/)
* **Health Check Endpoint:** [https://level-2-assignment-2-gilt.vercel.app/health](https://level-2-assignment-2-gilt.vercel.app/health)

---

## ⚡ Core Engineering Highlights

### 🛡️ 1. True Compile-Time Type-Safety with Global Declaration Merging
To prevent type-casting shortcuts (e.g., `as any`) inside route handlers and controllers, this project leverages TypeScript's declaration merging. We extend the standard Express `Request` interface globally in `auth.middleware.ts` to include the decoded JWT payload:
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
```
* **Impact:** Seamless compile-time verification across all routes, handlers, and middlewares.

### 🚀 2. Zero N+1 Queries via Relational Database Joins
Instead of firing N+1 sequential database requests to fetch issues and map their respective user information, the data layer utilizes optimized SQL `JOIN` statements inside a single roundtrip query:
```sql
SELECT 
  i.id, i.title, i.description, i.type, i.status, i.created_at, i.updated_at,
  u.id AS reporter_id, u.name AS reporter_name, u.role AS reporter_role
FROM issues i
JOIN users u ON i.reporter_id = u.id
ORDER BY i.created_at DESC;
```
* **Impact:** Reduced query latency, minimum network overhead, and optimized server memory consumption.

### ⏱️ 3. Safe Asynchronous Startup Sequence
The server bootstrap process in `server.ts` is fully `async`/`await` compliant. It ensures the PostgreSQL database pool connects and required relational tables are created and verified *before* the Express server begins listening for requests.
* **Impact:** Zero race conditions or failed requests during application boot up.

### 🛠️ 4. Dynamic SQL Query Generation for Updates
The UPDATE endpoint supports partial updates where users can pass any combination of fields (`title`, `description`, `type`, `status`). The service dynamically builds safe parametrized raw SQL queries avoiding SQL injection:
```typescript
const fields = [];
const params = [];
if (title) { fields.push(`title = $${count++}`); params.push(title); }
if (description) { fields.push(`description = $${count++}`); params.push(description); }
// ...
const sql = `UPDATE issues SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
```

---

## 🏗️ System Architecture

The following diagram illustrates the modular architectural hierarchy, request flows, and middleware injection:

```mermaid
graph TD
    Client[Client Browser / Postman] -->|HTTP Request| App[Express App Entry]
    App -->|CORS / JSON Parsing| GlobalMiddleware[Global Middlewares]
    GlobalMiddleware --> Router{Modular App Router}
    
    Router -->|/api/auth| AuthRouter[Auth Router]
    Router -->|/api/issues| IssueRouter[Issue Router]
    
    AuthRouter --> AuthController[Auth Controller]
    AuthController --> AuthService[Auth Service]
    AuthService --> DB[(PostgreSQL Database)]
    
    IssueRouter -->|JWT Auth Middleware| Authenticate[Authenticate Middleware]
    Authenticate -->|RBAC Filter| Authorize[Authorize Middleware]
    Authorize --> IssueController[Issue Controller]
    IssueController --> IssueService[Issue Service]
    IssueService --> DB
    
    App -->|Uncaught Exception| ErrorHandler[Global Error Handler]
```

---

## 🗄️ Database Schema & Relationships

The database is built on top of relational PostgreSQL tables with enforced constraints and check checks.

### Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ issues : "creates / reports"
    users {
        int id PK "SERIAL"
        string name "VARCHAR(255)"
        string email UK "VARCHAR(255) UNIQUE NOT NULL"
        string password "TEXT NOT NULL"
        string role "VARCHAR(255) DEFAULT 'contributor'"
        timestamp created_at "WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
        timestamp updated_at "WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
    }
    issues {
        int id PK "SERIAL"
        string title "VARCHAR(255) NOT NULL"
        string description "TEXT NOT NULL"
        string type "VARCHAR(255) CHECK (type IN ('bug', 'feature_request'))"
        string status "VARCHAR(255) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved'))"
        int reporter_id FK "INT REFERENCES users(id)"
        timestamp created_at "WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
        timestamp updated_at "WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
    }
```

---

## 👥 Role-Based Access Matrix

| Feature / Action | Contributor | Maintainer | Access Rules |
| :--- | :---: | :---: | :--- |
| **User Sign Up / Login** | ✔ | ✔ | Public access |
| **Create New Issues** | ✔ | ✔ | Requires valid authentication |
| **View Issues List** | ✔ | ✔ | Public access (sortable & filterable) |
| **View Single Issue Details**| ✔ | ✔ | Public access |
| **Update Own Issues** | ✔ | ✔ | Contributor can *only* update if issue status is `'open'` |
| **Update Any Issue Field** | ✖ | ✔ | Maintainers can modify all fields & transition statuses |
| **Delete Any Issue** | ✖ | ✔ | Strictly restricted to Maintainers |

---

## 🛠️ Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or higher) and a running instance of **PostgreSQL**.

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/amdadislam01/level-2_assignment-2.git
cd level-2_assignment-2
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root folder of the project and populate it with the following:
```env
PORT=5000
DATABASE_URL=postgresql://your_db_user:your_db_password@your_db_host:5432/your_db_name?sslmode=require
JWT_SECRET=your_super_complex_jwt_secret_key
JWT_EXPIRES_IN=1d
```
> [!NOTE]
> The database pool automatically manages SSL configurations: it disables SSL verification when pointing to `localhost` or `127.0.0.1`, and secures connections using `{ rejectUnauthorized: false }` for cloud databases like Supabase/Neon.

### 4. Database Table Initialization
On server boot, the application automatically executes migrations using raw queries. There is no need to manually import `.sql` files.

### 5. Running the App
* **Development Mode** (Hot-reloading via `tsx` watch):
  ```bash
  npm run dev
  ```
* **Production Build**:
  ```bash
  npm run build
  ```

---

## 🌐 API Endpoints Specification

### 🔐 1. Authentication Module

#### A. User Registration (`POST /api/auth/signup`)
* **Access Level:** Public
* **Request Body:**
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@devpulse.com",
  "password": "Password123",
  "role": "contributor"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "Alex Mercer",
    "email": "alex.mercer@devpulse.com",
    "role": "contributor",
    "created_at": "2026-05-23T11:00:00.000Z",
    "updated_at": "2026-05-23T11:00:00.000Z"
  }
}
```

#### B. User Login (`POST /api/auth/login`)
* **Access Level:** Public
* **Request Body:**
```json
{
  "email": "alex.mercer@devpulse.com",
  "password": "Password123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Alex Mercer",
      "email": "alex.mercer@devpulse.com",
      "role": "contributor",
      "created_at": "2026-05-23T11:00:00.000Z",
      "updated_at": "2026-05-23T11:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFsZXggTWVyY2VyIiwicm9sZSI6ImNvbnRyaWJ1dG9yIiwiaWF0IjoxNzEzNDg3NjA4LCJleHAiOjE3MTM1NzQwMDh9.xxxx..."
  }
}
```

---

### 📋 2. Issues Module

#### A. Create Issue (`POST /api/issues`)
* **Access Level:** Authenticated (`contributor` or `maintainer`)
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
```json
{
  "title": "Token refresh returns 403 under network jitter",
  "description": "Auth client gets stuck when switching connections, causing false positive logouts.",
  "type": "bug"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 10,
    "title": "Token refresh returns 403 under network jitter",
    "description": "Auth client gets stuck when switching connections, causing false positive logouts.",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-05-23T11:15:00.000Z",
    "updated_at": "2026-05-23T11:15:00.000Z"
  }
}
```

#### B. Get All Issues (`GET /api/issues`)
* **Access Level:** Public
* **Supported Query Parameters:**
  * `sort`: `newest` (default) or `oldest`
  * `type`: `bug` or `feature_request`
  * `status`: `open`, `in_progress` or `resolved`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "title": "Token refresh returns 403 under network jitter",
      "description": "Auth client gets stuck when switching connections, causing false positive logouts.",
      "type": "bug",
      "status": "open",
      "created_at": "2026-05-23T11:15:00.000Z",
      "updated_at": "2026-05-23T11:15:00.000Z",
      "reporter": {
        "id": 1,
        "name": "Alex Mercer"
      }
    }
  ]
}
```

#### C. Get Single Issue by ID (`GET /api/issues/:id`)
* **Access Level:** Public
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "Token refresh returns 403 under network jitter",
    "description": "Auth client gets stuck when switching connections, causing false positive logouts.",
    "type": "bug",
    "status": "open",
    "created_at": "2026-05-23T11:15:00.000Z",
    "updated_at": "2026-05-23T11:15:00.000Z",
    "reporter": {
      "id": 1,
      "name": "Alex Mercer",
      "role": "contributor"
    }
  }
}
```

#### D. Update Issue (`PATCH /api/issues/:id`)
* **Access Level:** Authenticated (`contributor` (own issues only, only if current status is `'open'`) or `maintainer` (any issue/field))
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body (Partial Update):**
```json
{
  "status": "in_progress"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Issue updated successfully",
  "data": {
    "id": 10,
    "title": "Token refresh returns 403 under network jitter",
    "description": "Auth client gets stuck when switching connections, causing false positive logouts.",
    "type": "bug",
    "status": "in_progress",
    "reporter_id": 1,
    "created_at": "2026-05-23T11:15:00.000Z",
    "updated_at": "2026-05-23T11:20:00.000Z"
  }
}
```

#### E. Delete Issue (`DELETE /api/issues/:id`)
* **Access Level:** Authenticated `maintainer` only
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```
