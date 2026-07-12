# TransitOps: Smart Transport Operations Platform

TransitOps is an enterprise-grade Smart Transport Operations Platform built as a robust, secure, and demo-ready full-stack application. It features a complete fleet management, driver safety, and trip scheduling operations system backed by a strict 4-layer Role-Based Access Control (RBAC) security paradigm and a modern visual aesthetic inspired by fintech SaaS interfaces (lavender-tinged backgrounds, large rounded borders, and glassmorphism elements).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Recharts, Lucide React, React Router Dom, Axios |
| **Backend** | Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `zod` validation, `helmet`, `cors`, `morgan`, `express-rate-limit` |
| **Database** | SQLite via `better-sqlite3` (single-file, WAL mode enabled, foreign key constraints active) |

---

## 🔒 4-Layer RBAC Matrix

Security is enforced at four independent levels (Navigation, Frontend Routes, Backend API Middleware, Controller Validation).

| Role | Navigation & Routes | Page Access | Write Actions Allowed | API Privilege Level |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Fleet Manager** | Full access | All pages | Create/Edit/Delete Vehicles & Drivers, Dispatch/Complete Trips, Open/Close Maintenance, Add Fuel/Expenses, Export CSV | Superuser |
| 🗺️ **Dispatcher** | Dashboard, Trips, Vehicles, Drivers | Operations focus | Dispatch, Complete, & Cancel Trips | Operations Manager |
| 🛡️ **Safety Officer** | Dashboard, Drivers, Maintenance, Reports | Compliance focus | Read-only access to lists, view compliance metrics | Compliance Auditor |
| 📈 **Financial Analyst** | Dashboard, Fuel & Expenses, Reports | Financial focus | Export CSV, Add Fuel/Expenses | Financial Auditor |
| 🚚 **Driver** | Dashboard, My Trips | Driver portal | None (Read-only own trips) | Driver Portal User |

---

## 🚦 Demo Accounts (Seeded)

| Role | Email | Password |
| :--- | :--- | :--- |
| 👑 **Fleet Manager** | `admin@transitops.com` | `Admin@123` |
| 🗺️ **Dispatcher** | `dispatcher@transitops.com` | `Dispatch@123` |
| 🛡️ **Safety Officer** | `safety@transitops.com` | `Safety@123` |
| 📈 **Financial Analyst** | `finance@transitops.com` | `Finance@123` |
| 🚚 **Driver** | `alex@transitops.com` | `Driver@123` |

---

## 📁 Folder Structure

```text
Transops/
├── backend/
│   ├── controllers/         # Controller actions
│   ├── middleware/          # JWT Auth and RBAC middleware
│   ├── routes/              # Express route definitions
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── dashboard.js     # KPIs & CSV Exports
│   │   ├── drivers.js       # Drivers & Safety logs
│   │   ├── finance.js       # Fuel & Expenses
│   │   ├── maintenance.js   # Shop & Repair logs
│   │   ├── trips.js         # Dispatch workflows
│   │   └── vehicles.js      # Vehicle Registry
│   ├── db.js                # SQLite init, WAL settings, indexing
│   ├── seed.js              # Deterministic database seeder script
│   └── server.js            # Express application bootstrapper
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components & layouts
│   │   │   ├── layout/      # Sidebar and top-bar layout
│   │   │   └── ui/          # Standardized UI elements (KPICard, DataTable, etc.)
│   │   ├── hooks/           # useAuth and useTheme hook states
│   │   ├── pages/           # Application views (Dashboard, Vehicles, etc.)
│   │   ├── services/        # Axios interceptors and APIs
│   │   ├── App.jsx          # Route mapping and Route Guards
│   │   ├── index.css        # FundFlow gradient backgrounds & glassy CSS tokens
│   │   └── main.jsx         # App entry point
```

---

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Authenticates user, issues 24h JWT.
- `GET /api/auth/me` - Verifies token validity.

### Vehicles
- `GET /api/vehicles` - Lists all vehicles.
- `GET /api/vehicles/available` - Lists dispatch-ready vehicles.
- `POST /api/vehicles` - Add new vehicle (Fleet Manager).
- `PUT /api/vehicles/:id` - Update vehicle specifications (Fleet Manager).
- `DELETE /api/vehicles/:id` - Remove vehicle from database (Fleet Manager).

### Drivers
- `GET /api/drivers` - Lists all drivers & safety scores.
- `GET /api/drivers/available` - Lists dispatch-ready, licensed drivers.
- `POST /api/drivers` - Add new driver (Fleet Manager).
- `PUT /api/drivers/:id` - Update driver stats (Fleet Manager).
- `DELETE /api/drivers/:id` - Delete driver profile (Fleet Manager).

### Trips
- `GET /api/trips` - Lists trips (filtered for Drivers).
- `POST /api/trips` - Creates a pending trip.
- `PUT /api/trips/:id/dispatch` - Transition trip to 'On Trip' status.
- `PUT /api/trips/:id/complete` - Completes trip, updates distance/fuel metrics.
- `PUT /api/trips/:id/cancel` - Cancels trip, releases drivers/vehicles.

### Maintenance
- `GET /api/maintenance` - Lists shop logs.
- `POST /api/maintenance` - Send vehicle to shop (sets vehicle status to 'In Shop').
- `PUT /api/maintenance/:id/close` - Close log, release vehicle.

---

## 🚀 Installation & Running

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- Git

### Setup & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aucxtix/dummy-trans.git
   cd dummy-trans
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Seed the database
   npm run seed
   # Start the Express Server
   npm start
   ```
   *Note: Server starts at `http://localhost:8000`.*

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Build the Production Bundle
   npm run build
   # Run the Vite Dev Server
   npm run dev
   ```
   *Note: Client starts at `http://localhost:5173`.*

---

## 📜 License

TransitOps is released under the **MIT License**.
