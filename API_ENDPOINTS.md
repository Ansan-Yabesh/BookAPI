# BookAPI - API Endpoints

Base paths:
- Auth routes: `/api/auth`
- Book routes: `/api/books`

## Auth Routes

### 1. Register (Public)
- Method: `POST`
- Path: `/api/auth/register`
- Auth: None
- Description: Public self-registration for regular users. Creates a user with role `user`, generates an OTP and sends a verification email.
- Body (JSON):
  ```json
  { "username": "string", "email": "user@example.com", "password": "string" }
  ```

### 2. Login
- Method: `POST`
- Path: `/api/auth/login`
- Auth: None
- Description: Login for approved users. Requires `emailVerified=true` and `status='approved'`. Returns a JWT token.
- Body (JSON): `{ "email": "user@example.com", "password": "string" }`

### 3. Create Manager (Admin only)
- Method: `POST`
- Path: `/api/auth/create-manager`
- Auth: Bearer token (Admin only)
- Description: Admin creates a manager account. Manager receives OTP email and must verify, then await admin approval.
- Body (JSON): `{ "username": "string", "email": "manager@example.com", "password": "string" }`

### 4. Verify OTP
- Method: `POST`
- Path: `/api/auth/verify-otp`
- Auth: None
- Description: Verify 6-digit OTP sent to the user's email. Marks `emailVerified=true` on success.
- Body (JSON): `{ "email": "user@example.com", "otp": "123456" }`

### 5. Resend OTP
- Method: `POST`
- Path: `/api/auth/resend-otp`
- Auth: None
- Description: Generate and resend a new OTP to the user's email.
- Body (JSON): `{ "email": "user@example.com" }`

### 6. Approve User
- Method: `PUT`
- Path: `/api/auth/approve/:userId`
- Auth: Bearer token (manager or admin)
- Description: Approve a verified user or manager. User must have `emailVerified === true`.

### 7. Reject User
- Method: `DELETE`
- Path: `/api/auth/reject/:userId`
- Auth: Bearer token (manager or admin)
- Description: Reject (delete) a pending user. Optional reason can be provided in the request body.
- Body (optional): `{ "reason": "Optional rejection reason" }`

### 8. Get All Users
- Method: `GET`
- Path: `/api/auth/users`
- Auth: Bearer token (admin only)
- Description: Admin-only list of all users (sensitive fields removed).

### 9. Get Pending Users
- Method: `GET`
- Path: `/api/auth/pending-users`
- Auth: Bearer token (manager or admin)
- Description: Users with `status='pending'` and `emailVerified=true`.

### 10. Update Profile
- Method: `PUT`
- Path: `/api/auth/profile`
- Auth: Bearer token (authenticated user)
- Description: Update own username, email or password.
- Body (any): `{ "username": "newname", "email": "newemail@example.com", "password": "newpass" }`

## Book Routes

### 1. Get Books (search / filter / pagination)
- Method: `GET`
- Path: `/api/books`
- Auth: None
- Query params:
  - `q` — text search (title, author, description)
  - `genres` — comma-separated genres (case-insensitive exact match)
  - `page` — page number (1-based)
- Response: `{ total, page, pages, perPage, results }`

### 2. Get Single Book
- Method: `GET`
- Path: `/api/books/:id`
- Auth: None

### 3. Create Book
- Method: `POST`
- Path: `/api/books`
- Auth: Bearer token (manager or admin)
- Body example: `{ "title": "string", "author": "string", "genre": "string", "description": "optional" }`

### 4. Update Book
- Method: `PUT`
- Path: `/api/books/:id`
- Auth: Bearer token (manager or admin)

### 5. Delete Book
- Method: `DELETE`
- Path: `/api/books/:id`
- Auth: Bearer token (manager or admin)

## Favorites (under `/api/books`)

### Get Favorites
- `GET /api/books/favorites` — Auth: user

### Add to Favorites
- `POST /api/books/:bookId/favorites` — Auth: user

### Remove from Favorites
- `DELETE /api/books/:bookId/favorites` — Auth: user

## Notes
- Add `Authorization: Bearer <token>` header for protected routes.
- Admin accounts must be created manually in the database; there is no API endpoint to create admins.
- Managers are created by the admin via `/api/auth/create-manager` and follow OTP + approval flow.

---

Examples:
- `GET /api/books?q=tolkien&page=2`
- `GET /api/books?genres=Fantasy,Adventure`
