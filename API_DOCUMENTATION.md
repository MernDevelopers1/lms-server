# LMS Backend API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints Overview

### Authentication Routes (`/auth`)

#### Login

- **POST** `/auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ success: boolean, data: { token: string, user: object } }`

#### Logout

- **POST** `/auth/logout`
- **Auth**: Required
- **Response**: `{ success: boolean, message: string }`

#### Get Current User

- **GET** `/auth/me`
- **Auth**: Required
- **Response**: `{ success: boolean, data: user }`

---

### Users Routes (`/users`)

#### Get All Users

- **GET** `/users?page=1&limit=10&role=Teacher&status=active`
- **Auth**: Required (Admin only)
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `role` (optional): Filter by role
  - `status` (optional): active, inactive, suspended
- **Response**: `{ success: boolean, data: { users: [], pagination: {} } }`

#### Get User by ID

- **GET** `/users/:id`
- **Auth**: Required
- **Response**: `{ success: boolean, data: user }`

#### Create User

- **POST** `/users`
- **Auth**: Required (Admin only)
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@school.test",
    "password": "password123",
    "phone": "+923001234567",
    "roleId": 2
  }
  ```
- **Response**: `{ success: boolean, data: user }`

#### Update User

- **PUT** `/users/:id`
- **Auth**: Required (Admin only)
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+923001234567",
    "status": "active",
    "roleId": 2
  }
  ```
- **Response**: `{ success: boolean, data: user }`

#### Delete User

- **DELETE** `/users/:id`
- **Auth**: Required (Admin only)
- **Response**: `{ success: boolean, message: string }`

---

### Academic Routes (`/academics`)

#### Academic Years

- **GET** `/academics/years` - Get all academic years
- **POST** `/academics/years` - Create academic year (Admin only)
  - Body: `{ title, startDate, endDate, isActive }`

#### Classes

- **GET** `/academics/classes?academicYearId=1` - Get classes
- **POST** `/academics/classes` - Create class (Admin only)
  - Body: `{ name, academicYearId, maxStudents }`

#### Subjects

- **GET** `/academics/subjects` - Get all subjects
- **POST** `/academics/subjects` - Create subject (Admin only)
  - Body: `{ name, code, description }`

#### Sections

- **GET** `/academics/sections?classId=1` - Get sections
- **POST** `/academics/sections` - Create section (Admin only)
  - Body: `{ name, classId, maxStudents }`

#### Assign Teacher to Subject

- **POST** `/academics/assign-teacher` (Admin only)
- Body: `{ teacherId, subjectId, classId }`

#### Enroll Student in Class

- **POST** `/academics/enroll-student` (Admin only)
- Body: `{ studentId, classId, sectionId }`

---

### Assignments Routes (`/assignments`)

#### Get Assignments

- **GET** `/assignments?classId=1&subjectId=1&teacherId=1`
- **Auth**: Required
- **Response**: List of assignments

#### Create Assignment

- **POST** `/assignments` (Teacher/Admin only)
- Body:
  ```json
  {
    "title": "Math Assignment 1",
    "description": "Chapter 5 exercises",
    "classId": 1,
    "subjectId": 1,
    "teacherId": 2,
    "dueDate": "2026-07-15",
    "totalMarks": 10
  }
  ```

#### Submit Assignment

- **POST** `/assignments/submit` (Student only)
- Body:
  ```json
  {
    "assignmentId": 1,
    "studentId": 3,
    "content": "My submission",
    "attachmentUrl": "https://example.com/file.pdf"
  }
  ```

#### Get Submissions

- **GET** `/assignments/submissions?assignmentId=1&studentId=3`
- **Auth**: Required

#### Grade Submission

- **POST** `/assignments/grade` (Teacher/Admin only)
- Body:
  ```json
  {
    "submissionId": 1,
    "marksObtained": 8,
    "feedback": "Good work!"
  }
  ```

---

### Attendance Routes (`/attendance`)

#### Mark Attendance

- **POST** `/attendance/mark` (Teacher/Admin only)
- Body:
  ```json
  {
    "classId": 1,
    "sectionId": 1,
    "subjectId": 1,
    "attendanceDate": "2026-06-16",
    "records": [
      { "studentId": 3, "status": "present" },
      { "studentId": 4, "status": "absent" }
    ]
  }
  ```

#### Get Attendance

- **GET** `/attendance?studentId=3&classId=1&fromDate=2026-06-01&toDate=2026-06-30&status=present`
- **Auth**: Required

#### Get Attendance Summary

- **GET** `/attendance/summary?studentId=3&classId=1`
- **Auth**: Required
- **Response**: `{ success: boolean, data: { present: 15, absent: 2 } }`

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Example Login Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.test",
    "password": "demo"
  }'
```

## Default Test Credentials

- **Admin**: admin@school.test / demo
- **Teacher**: teacher@school.test / demo
- **Student**: student@school.test / demo
- **Parent**: parent@school.test / demo
