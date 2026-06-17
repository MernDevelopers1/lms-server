# LMS Backend - Setup and Development Guide

## Project Structure

```
lms-server/
├── src/
│   ├── controllers/        # Business logic controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── academicController.js
│   │   ├── assignmentController.js
│   │   └── attendanceController.js
│   ├── routes/            # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── academicRoutes.js
│   │   ├── assignmentRoutes.js
│   │   └── attendanceRoutes.js
│   ├── middleware/        # Express middleware
│   │   └── authMiddleware.js
│   ├── utils/             # Utility functions
│   │   ├── passwordUtils.js
│   │   ├── jwtUtils.js
│   │   └── responseHandler.js
│   ├── scripts/
│   │   └── run-sql-file.js
│   └── server.js          # Main application file
├── database/
│   ├── schema.mysql.sql
│   ├── migrations/
│   │   └── 001_create_lms_tables.sql
│   └── seeds/
│       └── 001_seed_lms_tables.sql
├── .env.example
├── package.json
└── API_DOCUMENTATION.md
```

## Prerequisites

- Node.js (v14+)
- MySQL/MariaDB (XAMPP or standalone)
- npm

## Installation

1. **Navigate to the backend directory:**

   ```bash
   cd lms-server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create .env file:**

   ```bash
   cp .env.example .env
   ```

4. **Update .env with your database credentials:**

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=school_lms
   DB_USER=root
   DB_PASSWORD=
   JWT_SECRET=your-secret-key
   ```

5. **Setup database:**
   ```bash
   npm run db:setup
   ```
   This will:
   - Create the database
   - Run migrations
   - Seed initial data

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

### Quick Start - Authentication

**1. Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.test",
    "password": "demo"
  }'
```

**2. Use the returned token for authenticated requests:**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Database Management

### Run Migrations

```bash
npm run db:migrate
```

### Seed Database

```bash
npm run db:seed
```

### Reset Database (caution: deletes data)

```bash
npm run db:setup
```

## Architecture Overview

### Controllers

Handle business logic and request/response processing.

### Routes

Define HTTP routes and link them to controllers.

### Middleware

Handle cross-cutting concerns like authentication.

### Services

(To be added) - Contain reusable business logic.

### Utils

Helper functions for common tasks.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1. User logs in with email/password
2. Backend returns a JWT token
3. Client stores token in localStorage
4. Client sends token in Authorization header for subsequent requests
5. Backend validates token and processes request

## Default Test Users

| Email               | Password | Role    |
| ------------------- | -------- | ------- |
| admin@school.test   | demo     | Admin   |
| teacher@school.test | demo     | Teacher |
| student@school.test | demo     | Student |
| parent@school.test  | demo     | Parent  |

## Environment Variables

| Variable    | Description           | Default                              |
| ----------- | --------------------- | ------------------------------------ |
| PORT        | Server port           | 5000                                 |
| NODE_ENV    | Environment           | development                          |
| CLIENT_URL  | Frontend URL for CORS | http://localhost:3000                |
| DB_HOST     | Database host         | localhost                            |
| DB_PORT     | Database port         | 3306                                 |
| DB_NAME     | Database name         | school_lms                           |
| DB_USER     | Database user         | root                                 |
| DB_PASSWORD | Database password     | (empty)                              |
| JWT_SECRET  | JWT signing secret    | your-secret-key-change-in-production |

## Troubleshooting

### Database Connection Error

- Ensure MySQL is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Verify database exists: `school_lms`

### Port Already in Use

- Change PORT in .env
- Or kill the process using port 5000

### CORS Error

- Check CLIENT_URL matches your frontend URL
- Ensure credentials flag is set correctly

## Next Steps

1. Set up the frontend (lms-client)
2. Configure environment variables
3. Test API endpoints using provided documentation
4. Implement additional features as needed

## Future Enhancements

- [ ] Quiz/Exam management
- [ ] Live class integration (Zoom/Meet)
- [ ] Payment processing
- [ ] Notification system
- [ ] File upload handling
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Analytics dashboard
