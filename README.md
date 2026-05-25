# Dinezy (Client + Server)

हा repo 2 parts मध्ये आहे:

- `client/` → React + Vite (frontend)
- `server/` → Node.js + Express + MongoDB + Socket.IO (backend)

## Quick Start (Local)

### 1) Server चालू करा

```bash
cd server
npm install
npm run dev
```

Default: `PORT=5000`

### 2) Client चालू करा

```bash
cd client
npm install
npm run dev
```

Client API base URL:

- `VITE_API_URL` (उदा. `http://localhost:5000` किंवा `http://localhost:5000/api`)
- जर सेट नसेल तर default `http://localhost:5000` वापरतो

## Backend (Server) – Entry + Routes

### Entry

- `server/server.js` → HTTP server start + DB connect + Socket init
- `server/app.js` → Express app setup + routes + error middleware

### Base health

- `GET /` → `{ success: true, message: "Dinezy Server Running" }`

### API Routes (prefix: `/api`)

#### Auth (`/api/auth`)

- `POST /register` → register
- `POST /login` → login

#### Menu (`/api/menu`) *(auth + role-based)*

- `POST /create` *(OWNER, MANAGER)*
- `GET /all` *(auth)*
- `PUT /update/:id` *(OWNER, MANAGER)*
- `DELETE /delete/:id` *(OWNER, MANAGER)*

#### KOT (`/api/kot`) *(auth + role-based)*

- `POST /create` *(CAPTAIN)*
- `GET /all` *(auth)*
- `GET /by-table` *(CAPTAIN, MANAGER)*
- `POST /complete-order` *(CAPTAIN)* (no payment)
- `POST /close-bill` *(CAPTAIN)*
- `PUT /update-status/:id` *(KITCHEN)*

#### Table (`/api/table`) *(auth + role-based काही ठिकाणी)*

- `POST /create` *(OWNER, MANAGER)*
- `GET /all` *(auth)*
- `PUT /update/:id` *(auth)*
- `GET /bill-draft/:id` *(MANAGER, CAPTAIN)*
- `PUT /bill-draft/:id` *(MANAGER, CAPTAIN)*

#### Bill (`/api/bill`) *(CAPTAIN, MANAGER)*

- `POST /create`
- `POST /create-from-table` (merge KOTs)
- `GET /all` *(auth)*

#### Report (`/api/report`) *(OWNER, MANAGER)*

- `GET /today-sales`
- `GET /payment-report`

#### Customer (`/api/customer`) *(CAPTAIN, MANAGER)*

- `POST /upsert`

## Socket.IO (Server)

Server side socket init: `server/config/socket.js`

Key events:

- `register-user` → socket room join: `user:<userId>`
- `new-kot` → broadcast `receive-kot`
- `update-kot-status` → broadcast `kot-status-updated`
- `table-status-update` → broadcast `table-updated`
- `bill-generated` → broadcast `new-bill-generated`
- `payment-collected` → broadcast `payment-success`
- `send-notification` → broadcast `receive-notification`

Helper:

- `emitToUser(userId, event, payload)` → specific user room ला emit

## Frontend (Client) – Pages + Routes

Entry:

- `client/src/main.jsx` → `App` render + `ErrorBoundary`
- `client/src/App.jsx` → `AppRoutes`

Routes: `client/src/routes/AppRoutes.jsx`

- `/` → Login
- `/owner` → OwnerDashboard
- `/manager` → ManagerDashboard
- `/captain` → CaptainDashboard *(ProtectedRoute roles: CAPTAIN)*
- `/kitchen` → KitchenDashboard
- `/kitchen-display` → KitchenDashboard (withSidebar)
- `/menu` → Menu *(ProtectedRoute)*
- `/tables` → TableView (withSidebar)

Auth guard: `client/src/routes/ProtectedRoute.jsx`

- `localStorage` keys:
  - `dinezy_token`
  - `dinezy_user` (JSON; `role` check साठी)

Socket client: `client/src/socket/socket.js`

- `VITE_API_URL` वरून base URL normalize करून socket connect करतो.

## Notes / Risks (Project Hygiene)

हे मुद्दे लक्षात ठेव:

- `server/.env` repo मध्ये आहे (JWT secret + Mongo URI). सामान्यतः `.env` commit न करता `.env.example` ठेवतात.
- `server/` मध्ये `.gitignore` नाही. `node_modules/` git मध्ये जाण्याचा risk आहे (workspace मध्ये `client/node_modules` आणि `server/node_modules` आहेत).
- CORS/socket मध्ये `origin: '*'` आहे (production मध्ये tighten करणे advisable).
- Client routes मध्ये `/owner`, `/manager`, `/kitchen`, `/tables` unprotected आहेत; role/token protection अपेक्षित असेल तर update करावा लागेल.
