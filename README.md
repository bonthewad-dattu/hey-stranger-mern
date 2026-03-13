# Hey Stranger - MERN Dashboard

This project is a MERN-stack version of the existing "Hey Stranger" social media dashboard UI.

## Folder Structure

```text
project-root/
├── client/   # React frontend
└── server/   # Node + Express + MongoDB backend
```

---

## 1. Backend (server)

### Tech
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing

### Structure

- `server/index.js` – Express app entry
- `server/config/db.js` – MongoDB connection
- `server/models/User.js` – User model
- `server/models/Post.js` – Post model
- `server/models/Reaction.js` – Reaction model
- `server/models/Comment.js` – Comment model
- `server/middleware/auth.js` – JWT auth middleware
- `server/routes/auth.js` – `POST /api/auth/register`, `POST /api/auth/login`
- `server/routes/posts.js` – `GET /api/posts`, `POST /api/posts`, `DELETE /api/posts/:id`
- `server/routes/dashboard.js` – `GET /api/dashboard/stats`

### Environment variables

Create `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/hey-stranger
JWT_SECRET=some_super_secret_key
PORT=5000
```

You can use a local MongoDB instance or MongoDB Atlas – just set `MONGO_URI` accordingly.

### Install & run backend

From `project-root/server`:

```bash
npm install
npm run dev   # or: npm start
```

The API will be available at `http://localhost:5000/api`.

---

## 2. Frontend (client)

### Tech
- React 18
- React Router v6
- Axios (for API calls)
- CSS Modules (styles ported from the original HTML/CSS)

### Structure

- `client/src/index.jsx` – React entry, wraps app with `BrowserRouter`
- `client/src/App.jsx` – main router and layout
- `client/src/components/Layout.jsx` – global layout (header + sidebar + main)
- `client/src/components/Header.jsx` – top header (search, icons)
- `client/src/components/Sidebar.jsx` – left navigation
- `client/src/components/StatsCards.jsx` – dashboard stats cards
- `client/src/components/SearchBar.jsx` – search input
- `client/src/components/PostTable.jsx` – posts table
- `client/src/pages/Dashboard.jsx` – main dashboard page (stats + posts table)
- `client/src/pages/Settings.jsx` – placeholder for settings
- `client/src/pages/Themes.jsx` – placeholder for themes
- `client/src/pages/Users.jsx` – placeholder for users
- `client/src/services/api.js` – Axios instance
- `client/src/services/auth.js` – starter auth service (login/register)

### Routes

Using React Router v6, the main routes are:

- `/dashboard`
- `/settings`
- `/themes`
- `/users`

`App.jsx` renders these routes inside the shared `Layout` (header + sidebar), replacing the original frameset/iframe structure.

### Install & run frontend

From `project-root/client`:

```bash
npm install
npm start
```

This starts a webpack dev server on `http://localhost:3000`.

The React app expects the backend at `http://localhost:5000` (configured in `client/src/services/api.js`).

---

## 3. API Integration

The dashboard page (`Dashboard.jsx`) does the following:

- Fetches stats via `GET /api/dashboard/stats` and shows them in `StatsCards`.
- Fetches posts via `GET /api/posts` and displays them in `PostTable`.
- Filters posts client-side with the search bar.
- Calls `DELETE /api/posts/:id` when the delete button is clicked.
- Shows a simple alert preview when the view button is clicked (you can upgrade this to a modal later).

### Auth starter

- `POST /api/auth/register` and `POST /api/auth/login` are implemented on the backend.
- `client/src/services/auth.js` exposes simple `register` and `login` helpers.
- For now, the dashboard calls are public for `GET` requests; `POST /api/posts` and `DELETE /api/posts/:id` require a valid JWT in the `Authorization: Bearer <token>` header.
- You can extend the frontend to store the token (e.g. in `localStorage`) and attach it to Axios requests.

---

## 4. How to get started

1. **Start MongoDB**
   - Local: make sure MongoDB is running and reachable at your `MONGO_URI`.
   - Atlas: create a cluster and use its connection string as `MONGO_URI`.

2. **Configure backend**
   - Create `server/.env` with `MONGO_URI`, `JWT_SECRET`, and `PORT`.
   - From `server/` run:
     ```bash
     npm install
     npm run dev
     ```

3. **Configure frontend**
   - From `client/` run:
     ```bash
     npm install
     npm start
     ```
   - Open `http://localhost:3000` in the browser.

4. **Optional: seed some posts**
   - You can temporarily `POST /api/posts` with a tool like Postman or Insomnia using a JWT token from `/api/auth/register`/`/api/auth/login`.
   - Once posts, comments, and reactions exist, they will be reflected in the stats and table.

---

## 5. Customization

- You can adjust the CSS Modules in `client/src/components/*.module.css` to tweak spacing, colors, or responsiveness while keeping the overall visual design.
- To add a real post preview modal, replace the `alert` in `Dashboard.jsx` with a modal component.
- To build a full auth flow, create login/register pages that use `auth.js` and store the JWT, then inject the token into the Axios instance (e.g. via an interceptor).
