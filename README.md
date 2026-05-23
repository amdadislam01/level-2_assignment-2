# 🚼 DevPulse – Internal Tech Issue & Feature Tracker

DevPulse is a high-performance, developer-focused collaborative platform designed for engineering teams to report bugs, suggest features, and track technical resolutions. 

This project features a secure role-based authentication system, a modular routing architecture, and a fully relational PostgreSQL database backend utilizing native raw SQL queries.

---

### 🛡️ 1. True Type-Safety with Global Declaration Merging
- **AI-Free Routing:** Avoids sloppy `as any` typecasts or manual casts inside routes and controllers.
- **Global Express Merging:** Implements TypeScript declaration merging in `auth.middleware.ts` to extend the standard Express `Request` interface globally:
  ```typescript
  declare global {
    namespace Express {
      interface Request {
        user?: UserPayload;
      }
    }
  }
  ```
- **Result:** All Express route handlers and middleware functions match native signatures seamlessly with complete, end-to-end compile-time safety.

### ⚡ 2. High-Performance SQL Joins (Zero N+1 Queries)
- **Single-Roundtrip Retrieval:** Eliminates the classic N+1 database mapping problem where separate queries were fired for issues and reporter details.
- **Database-Level Joins:** Uses highly optimized, native SQL `JOIN` statements in the database query layer:
  ```sql
  SELECT 
    i.id, i.title, i.description, i.type, i.status, i.created_at, i.updated_at,
    u.id AS reporter_id, u.name AS reporter_name, u.role AS reporter_role
  FROM issues i
  JOIN users u ON i.reporter_id = u.id
  ```
- **Result:** Drastically reduces query latency, database load, and server memory consumption.

### ⏱️ 3. Safe Asynchronous Startup Sequence
- **Awaited Initialization:** Converted the application startup entry point (`server.ts`) to be fully `async`/`await` compliant.
- **Proper Order:** Ensures all PostgreSQL tables are successfully created/verified *before* the server starts listening for incoming client requests, preventing race conditions or database connection drops during initial hits.

### 📁 4. Modern Configuration Architecture
- **Environment Isolation:** Clean named `env` exports in `envConfig.ts` instead of generic, bulky default exports.
- **Auto-Timestamping:** Seamlessly updates the `updated_at` column to `CURRENT_TIMESTAMP` on all issue modifications, maintaining database accuracy.

---

## 🛠️ Technology Stack
* **Runtime**: Node.js LTS (v24.x or higher)
* **Language**: TypeScript
* **Framework**: Express.js (Modular router architecture)
* **Database**: PostgreSQL (Native `pg` driver, raw SQL queries without ORMs/Query Builders)
* **Security**: `bcrypt` (Password hashing) & `jsonwebtoken` (JWT authentication)
* **Status Codes**: `http-status-codes`

---

## 👥 User Roles & Permissions

| Role | Permissions |
| :--- | :--- |
| **contributor** | • Register & login<br>• Create new issues (bug or feature request)<br>• View all issues/details<br>• Update own issues (only if status is still "open") |
| **maintainer** | • All contributor permissions<br>• Update any issue field / status<br>• Delete any issue<br>• Access system metrics |

---

## 🗄️ Database Schema

### `users` Table
* **id**: `SERIAL PRIMARY KEY`
* **name**: `VARCHAR(255)`
* **email**: `VARCHAR(255) UNIQUE NOT NULL`
* **password**: `TEXT NOT NULL`
* **role**: `VARCHAR(255) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer'))`
* **created_at / updated_at**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `issues` Table
* **id**: `SERIAL PRIMARY KEY`
* **title**: `VARCHAR(255) NOT NULL`
* **description**: `TEXT NOT NULL`
* **type**: `VARCHAR(255) NOT NULL CHECK (type IN ('bug', 'feature_request'))`
* **status**: `VARCHAR(255) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved'))`
* **reporter_id**: `INT NOT NULL` (references `users.id`)
* **created_at / updated_at**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

## 🏁 Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** and a running **PostgreSQL** database.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (`.env`)
Create a `.env` file in the root directory and add the following keys:
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
```

### 4. Run the Application
* **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
* **Build TypeScript**:
  ```bash
  npm run build
  ```

---

## 🌐 API Endpoints Specification

### 🔹 Authentication Module

#### 1. User Registration
* **Endpoint**: `POST /api/auth/signup`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "password": "securePassword123",
    "role": "contributor"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor",
      "created_at": "2026-05-20T22:00:00Z",
      "updated_at": "2026-05-20T22:00:00Z"
    }
  }
  ```

#### 2. User Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "john.doe@devpulse.com",
    "password": "securePassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User logged in successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@devpulse.com",
        "role": "contributor",
        "created_at": "2026-05-20T22:00:00Z",
        "updated_at": "2026-05-20T22:00:00Z"
      }
    }
  }
  ```

---

### 🔹 Issues Module

#### 3. Create Issue
* **Endpoint**: `POST /api/issues`
* **Access**: Authenticated users (`contributor`, `maintainer`)
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug"
  }
  ```

#### 4. Get All Issues
* **Endpoint**: `GET /api/issues`
* **Access**: Public
* **Query Parameters**:
  * `sort`: `newest` (default) or `oldest`
  * `type`: `bug` or `feature_request`
  * `status`: `open`, `in_progress`, or `resolved`

#### 5. Get Single Issue
* **Endpoint**: `GET /api/issues/:id`
* **Access**: Public

#### 6. Update Issue
* **Endpoint**: `PATCH /api/issues/:id`
* **Access**: `maintainer` (any issue) OR `contributor` (own issues only, and only if current status is `"open"`)
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Body** (All fields optional):
  ```json
  {
    "title": "Updated title",
    "description": "Updated description with new details",
    "type": "bug",
    "status": "in_progress"
  }
  ```

#### 7. Delete Issue
* **Endpoint**: `DELETE /api/issues/:id`
* **Access**: `maintainer` only
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
