## What is this project?

BookAPI is a simple web service built with Node.js and Express. It lets you manage books and save your favorite ones. Users can sign up, verify email via OTP, get approved by admins/managers, and then log in with roles like user, manager, or admin. Admins and managers can add, edit, or delete books. Users can view books and manage favorites.

## Key Features

- **User Accounts**: Sign up, verify email via OTP, and get approved by admins or managers before login.
- **Email Verification**: One-Time Password (OTP) sent to email during registration for secure verification.
- **Roles**: Three types - user (view and favorite books), manager (manage books and approve users), admin (full control, create managers).
- **Books**: Add, view, update, delete books (managers/admins only). Search, filter by genre, and paginate results.
- **Favorites**: Add or remove books from favorites (users only).
- **Security**: JWT tokens for login, bcrypt password hashing, OTP email verification, and role-based permissions.

## How to Set It Up

1. Install Node.js (version 14 or higher).
2. Get the project files.
3. Run `npm install` in the project folder.
4. Set up MongoDB and create a database called "BookAPI".
5. Create a `.env` file. Use `.env.example` as a template. Key variables:
   ```
   JWT_SECRET=your_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/BookAPI
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SENDER_EMAIL=noreply@bookapi.com
   ```
   - For Gmail: Enable 2FA and generate an [App Password](https://myaccount.google.com/apppasswords).
   - For other providers (Mailtrap, SendGrid, etc.): Use their SMTP credentials.

6. Run `npm start` (or `npm run dev` for development). The API runs on `http://localhost:3000`.

## New User Registration & Approval Flow

### Step 1: User Registers
- User submits: `POST /api/auth/register` with username, email, password.
- Server generates a 6-digit OTP and sends it to the user's email.
- User receives: "An OTP has been sent to your email. Please verify your email before your account can be approved."

### Step 2: User Verifies Email with OTP
- User receives OTP in email (valid for 10 minutes).
- User submits: `POST /api/auth/verify-otp` with email and OTP.
- Server marks email as verified. User now has `emailVerified: true` and status: `pending`.

### Step 3: Admin/Manager Approves User
- Admin/Manager retrieves pending users: `GET /api/auth/pending-users`.
- Admin/Manager approves user: `PUT /api/auth/approve/:userId`.
- Server sends approval email to user.

### Step 4: User Can Log In
- User submits: `POST /api/auth/login` with email and password.
- Server verifies: email is verified AND status is approved.
- User receives JWT token and can use the API.

### Resend OTP (if expired)
- User can request a new OTP: `POST /api/auth/resend-otp` with email.
- New OTP sent to email (10-minute validity).

## How to Use It

Use Postman or similar to test. All routes are under `/api`.

### Authentication Routes (New OTP Flow)
- **POST /api/auth/register** - Sign up. Body: `{username, email, password}`. Optional: `role` (default: "user").
  - Response: OTP sent to email, user created with `emailVerified: false`.
  
## BookAPI — Quick Overview

BookAPI is a small Node.js/Express backend to store books and let users save favorites. It uses email OTP verification and role-based access (user, manager, admin).

Key points:
- Users sign up and verify their email with an OTP.
- Admin (single, created manually) can create managers.
- Managers and admins can add/update/delete books.
- Users can view books and manage favorites.

Getting started
1. Run `npm install`.
2. Create a `.env` file (copy `.env.example`) and fill values.
3. Start the server:

```powershell
npm start
```

Environment essentials (`.env`):
- `MONGODB_URI` — e.g. `mongodb://localhost:27017/bookapi`
- `JWT_SECRET` — a secret string for tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — email SMTP settings
- `SENDER_EMAIL` — address shown in "From" for sent emails

Main endpoints (short):
- `POST /api/auth/register` — public sign-up (users only). Sends OTP.
- `POST /api/auth/verify-otp` — verify OTP.
- `POST /api/auth/login` — login (requires verified & approved).
- `POST /api/auth/create-manager` — admin-only: create manager (OTP + approve flow).
- `PUT /api/auth/approve/:userId` — approve a user/manager (manager or admin).
- `GET /api/books` — list books (supports `q`, `genres`, `page`).
- `POST /api/books` — add book (manager/admin).

Testing tips
- Use Postman: import the project Postman collection (if present) or call the endpoints above.
- To send email via Gmail, enable 2FA and use an App Password for `SMTP_PASS`.

