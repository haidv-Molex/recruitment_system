# Recruitment System Backend 🚀

The backend engine for the Recruitment System, built using Node.js (TypeScript), Express, PostgreSQL, and Redis. It provides a robust, production-grade REST API, real-time events via Socket.IO, secure JWT authentication with refresh token rotation, and transaction-safe database operations.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Language:** Node.js, TypeScript (Strict Mode)
- **Web Framework:** Express 4
- **Database:** PostgreSQL (`pg` pool connection)
- **Cache & Pub/Sub:** Redis (`ioredis` + Socket.IO Redis adapter for horizontal scaling)
- **Process Manager:** PM2 (Cluster Mode)
- **Authentication:** Passport.js (Local & JWT strategies)
- **Logging:** Winston Logger
- **Input Validation:** Joi
- **Testing:** Mocha, Chai, Sinon, Pactum

### Architectural Patterns

The codebase strictly follows a clean **layered architecture**:

```
[Client Request]
       │
       ▼
[Controller Layer] (Express Routers, Joi Validation, Auth middleware, DB Transaction wrapper)
       │
       ▼
[Facade Layer] (_ClassName.ts - Exposes static methods to wrap separate service files)
       │
       ▼
[Service Layer] (Pure Business Logic - stateless functions receiving DB client as last parameter)
       │
       ▼
  [Model Layer] (TypeScript Type definitions + SQL Schemas)
```

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed:
- **Node.js** (v18 or newer recommended)
- **PostgreSQL** (v15+)
- **Redis** (v7+)
- *Alternatively:* **Docker & Docker Compose** to spin up database/cache instances.

---

## ⚙️ Installation & Configuration

### 1. Install Dependencies

Clone the project and install the NPM packages:
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory and configure it based on your environment. Here is a baseline configuration:
```ini
# Server Setup
PORT=3000
NODE_ENV=development
HOST=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Authentication Token Lifetime
SECRET_AUTH_TOKEN_KEY=your_secret_auth_token_key_here
EXPIRES_TOKEN=15m
EXPIRES_REFRESH_TOKEN=30d

# Google OAuth (Optional/Strategy Specific)
GOOGLE_CLIENT_ID=google-client-id-placeholder.apps.googleusercontent.com

# PostgreSQL Connection
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_db_password
PG_DATABASE=recruitment

# Redis Cache & Socket.io Adapter
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_TIME_OUT=3600

# File Upload Location
PATH_SAVE_FILE=./uploads
```

### Outlook Email Smoke Test

To test sending an email through the company Outlook account, configure these local-only variables in `.env`:

```ini
OUTLOOK_SMTP_USER=thinh.vu@molex.com
OUTLOOK_SMTP_PASSWORD=your_app_password_or_it_approved_password
OUTLOOK_SMTP_FROM=thinh.vu@molex.com
TEST_EMAIL_TO=hai.do@molex.com
TEST_EMAIL_ENABLED=true
```

For an internal SMTP relay such as `smtp.molex.com`, configure relay mode instead:

```ini
OUTLOOK_SMTP_HOST=smtp.molex.com
OUTLOOK_SMTP_PORT=25
OUTLOOK_SMTP_AUTH_ENABLED=false
OUTLOOK_SMTP_IGNORE_TLS=true
OUTLOOK_SMTP_FROM=thinh.vu@molex.com
TEST_EMAIL_TO=hai.do@molex.com
TEST_EMAIL_ENABLED=true
```

Then run:

```bash
npm run test:email
```

Or test through Postman after starting the backend:

```text
POST http://localhost:3000/email/test
Content-Type: application/json
```

```json
{
       "to": "hai.do@molex.com",
       "subject": "Test email from Recruitment System",
       "text": "Hello, this email was sent from Postman through the backend."
}
```

If the company blocks SMTP authentication for this mailbox, use Microsoft Graph API instead of a normal Outlook password.

### 3. Initialize & Seed Database

The database setup uses dynamic SQL compilation based on model schemas:

1. **Compile SQL Schema Files:**
   Scans `model/` recursively, parses tables, resolves foreign keys dependencies, and outputs sorted SQL files into `init-db/`:
   ```bash
   npm run init-db
   ```
2. **Execute Schema & Default Seed:**
   Drops and recreates the public schema, running all compiled scripts under `init-db/` in alphabetical order:
   ```bash
   npm run run-init-db
   ```
   *Note: This inserts an admin account (`Admin`/`Admin`) and default data tables (`department`, `platform`, `level`, `site`).*

---

## 🏃 Running the Application

### 🐳 Option A: Docker Compose (Recommended for Production/Testing Environment)

Spin up PostgreSQL, Redis, and the compiled Node App:
```bash
docker-compose up --build -d
```
Docker compose will automatically run database initialization via mounting `./init-db` to `/docker-entrypoint-initdb.d`.

### 💻 Option B: Local Development

For active development, run the PM2 process manager configured for development:
```bash
# Start PM2 in watch & cluster mode
npm run dev

# Stop all PM2 instances
npm run stop

# Restart PM2
npm run restart

# Stream logs
npm run logs

# PM2 dashboard monitor
npm run monit
```

Alternatively, you can run directly using Nodemon:
```bash
npm run start
```

---

## 🧪 Testing

The test suite uses Mocha and Chai, running on top of `ts-mocha` to compile TypeScript paths/aliases at runtime.

### Rules of Testing
- **Real Database Connection:** Tests run on a real PostgreSQL database to validate constraints.
- **Rollback Pattern:** All test cases must use transactions (`BEGIN` ... `ROLLBACK`) inside `beforeEach`/`afterEach` blocks to keep the database clean. No seed data or test mutations persist after execution.
- **Stubs:** Redis, file systems, and external integrations should be stubbed out using `sinon`.

### Running Tests

```bash
# Run all tests
npm run test

# Run a specific test file
npm run test:file -- test/services/user/createUser.test.ts

# Generate test coverage report
npm run test:coverage
```

---

## 📝 Conventions & Best Practices

1. **Import Aliases:** Always use paths configured in `tsconfig.json` (e.g. `@services/*`, `@controller/*`, `@model/*`, `@middlewares/*`, `@utilities/*`).
2. **No Raw SQL in Controllers:** Controllers handle HTTP requests and responses. All queries and DB calls must happen inside the Service layer.
3. **DB Transactions:** Every query must be bocked inside the database transaction wrapper `withTransaction(async (pool) => { ... })`.
4. **Joi Schema Validation:** Every input (body, query, params) must be validated using `joiValidate(schema, target)` middleware in the controller routers.
5. **No Password Leakage:** Always sanitize returned user records using `userOutputModel` to ensure sensitive parameters (`user_account`, `user_password`) are never exposed in JSON responses.
6. **No Direct Castings:** Never use `as Type` to cast databases rows. Instead, explicitly define and map object properties using typescript `satisfies Type`.
7. **Pagination Payload:** Standard response shape for paginated listings puts pagination metrics outside the `data` block:
   ```json
   {
     "result": true,
     "message": "Fetch data successfully",
     "data": [...],
     "pagination": {
       "current_page": 1,
       "total_pages": 5,
       "total_items": 50
     }
   }
   ```
