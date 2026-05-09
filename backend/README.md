# Hiltheo Synergy Backend

This is the backend API for Hiltheo Synergy with Google OAuth integration.

## Features

- **Google Sign-In** - OAuth 2.0 integration with Google
- **JWT Authentication** - Secure token-based authentication
- **User Management** - Register/login with email or Google
- **Protected Routes** - Admin-only access with authentication
- **RESTful API** - Full CRUD operations for vehicle inventory

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=your_random_jwt_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost`
   - `http://localhost:5173`
7. Add authorized redirect URIs (for backend):
   - `http://localhost:5000/api/auth/google/callback`
8. Copy the **Client ID** and **Client Secret** to your `.env` file

### 4. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google Sign-In |
| POST | `/api/auth/login` | Email/Password Login |
| POST | `/api/auth/signup` | User Registration |
| GET | `/api/auth/verify` | Verify JWT Token |
| GET | `/api/config/google` | Get Google Client ID |

### Admin (Protected)

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/cars` | Get all cars |
| POST | `/api/admin/cars` | Create new car |
| PUT | `/api/admin/cars/:id` | Update car |
| DELETE | `/api/admin/cars/:id` | Delete car |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |

## Google Sign-In Flow

1. Frontend loads Google Sign-In button with Client ID
2. User clicks button and authenticates with Google
3. Google returns ID token to frontend
4. Frontend sends token to `POST /api/auth/google`
5. Backend verifies token with Google
6. Backend creates/updates user and generates JWT
7. Frontend stores JWT and uses it for authenticated requests

## Data Storage

**Note:** This backend uses in-memory storage for demo purposes. In production, replace with a real database like MongoDB, PostgreSQL, or MySQL.

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Get Google Client ID
curl http://localhost:5000/api/config/google
```

## Production Deployment

Before deploying to production:

1. Replace in-memory storage with a real database
2. Use secure HTTPS for all requests
3. Store sensitive data in environment variables
4. Add rate limiting to prevent abuse
5. Add input validation and sanitization
6. Use a process manager like PM2

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **Google Auth Library** - OAuth verification
- **JWT** - Token authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin requests
