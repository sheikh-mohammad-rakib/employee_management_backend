# Backend Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Edit `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key_here
```

### 3. Create Database
Create a PostgreSQL database:
```bash
# Using psql
psql -U postgres
CREATE DATABASE employee_management;
\q
```

### 4. Initialize Database Schema
Run the database initialization script:
```bash
npm run init-db
```

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/request-otp` - Request OTP for password change
- `POST /api/auth/verify-otp` - Verify OTP and change password

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/today` - Get today's status
- `GET /api/attendance/my-records` - Get own attendance records
- `GET /api/attendance/all` - Get all attendance (Admin/HR)

### Leave Requests
- `POST /api/leaves` - Submit leave request
- `GET /api/leaves/my-requests` - Get own leave requests
- `GET /api/leaves/all` - Get all leave requests (Admin/HR)
- `PATCH /api/leaves/:id/status` - Update leave status (Admin/HR)

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get tasks (role-based)
- `GET /api/tasks/:id` - Get task by ID
- `PATCH /api/tasks/:id` - Update task status
- `DELETE /api/tasks/:id` - Delete task (Admin/HR)

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users` - Get all users (Admin/HR)
