# TransitOps - Smart Transport Platform

TransitOps is a sophisticated, full-stack transportation and fleet management platform designed for enterprise logistics. The platform employs a role-based, decoupled architecture that offers specialized interfaces and secure operations for different organizational roles. 

Built with modern web technologies, it features a React frontend powered by Vite and a robust Node.js backend using Express and SQLite.

## Core Features

- **Role-Based Access Control (RBAC):** Deeply integrated authorization that dynamically tailors UI components and backend data payloads for five distinct roles:
  - 🚚 **Fleet Manager**: High-level KPIs, fleet utilization rates, expense approvals, and overall monitoring.
  - 🗺️ **Dispatcher**: Active route tracking, pending dispatch queues, and quick-assign capabilities.
  - 👨‍✈️ **Driver**: Personal schedules, active trip status, distance logging, and safety score tracking.
  - 📊 **Financial Analyst**: Secure ledger for pending expenses, overall fuel costs, and toll analytics.
  - 🛡️ **Safety Officer**: Driver safety rankings, critical maintenance alerts, and compliance oversight.
- **Optimistic UI Updates:** Instantaneous feedback on critical actions (like dispatching and completing trips) without manual page refreshes.
- **Centralized Security:** Secure environment variable parsing (Zod), rate limiting, and JWT-based authentication.
- **Dynamic Routing:** A single master Dashboard component dynamically routes and renders optimized views based strictly on authenticated role state.
- **Glassmorphism Aesthetic:** Premium, highly-responsive user interface styled with Tailwind CSS, utilizing dark/light mode context.

## Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React (Icons), React Router, Axios
- **Backend:** Node.js, Express.js, better-sqlite3, jsonwebtoken, bcryptjs, Zod (Schema Validation)
- **Database:** SQLite (WAL mode enabled for high concurrency)

## Architecture Overview

The system recently underwent a major architectural refactor to eliminate monolithic structures. The backend now executes optimized, isolated SQLite queries per role using a strict `switch(req.user.roleName)` block. On the frontend, `Dashboard.jsx` acts as a pure router, delegating rendering to isolated sub-components (e.g., `FleetManagerDash`, `DriverDash`). 

A robust foreign-key implementation links authentication profiles (`users` table) directly to operational profiles (`drivers` table), ensuring complete data integrity and preventing unauthorized mutations.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the backend folder:
   ```env
   PORT=8000
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=24h
   NODE_ENV=development
   ```
4. Seed the SQLite database:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5173`.

## Default Test Accounts (Passwords are Role@123)
- **Fleet Manager:** admin@transitops.com (Admin@123)
- **Dispatcher:** dispatcher@transitops.com (Dispatch@123)
- **Driver:** alex@transitops.com (Driver@123)
- **Finance:** finance@transitops.com (Finance@123)
- **Safety:** safety@transitops.com (Safety@123)

## Security Enhancements
- Passwords are strictly hashed via `bcryptjs`.
- All routes are protected by the `authenticate` JWT middleware.
- Specific actions (like dispatching trips) utilize `requireRole` middleware to block unauthorized HTTP requests.
- The `drivers` schema enforces a strict `user_id` foreign key mapped to the authentication layer to prevent context-switching vulnerabilities.

## License
MIT License.
