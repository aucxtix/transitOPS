# Transops

Transops is a comprehensive, full-stack transit and transportation operations management platform. Built with a modern tech stack, it provides fleet managers and operators with the tools they need to track, manage, and optimize their daily transportation workflows.

## 🚀 Features

- **Fleet Management:** Track and manage vehicles, their statuses, and assignments.
- **Driver Management:** Keep records of drivers, schedules, and performance metrics.
- **Trip Tracking:** Monitor active, upcoming, and completed trips.
- **Maintenance Logs:** Schedule, track, and log vehicle maintenance to ensure safety and reliability.
- **System Logs & Reports:** Generate comprehensive reports and view system logs for actionable insights.
- **Secure Authentication:** JWT-based authentication for secure access to the dashboard.

## 🛠️ Tech Stack

### Frontend
- **React 19** & **Vite** for a fast, modern user interface.
- **Tailwind CSS v4** for highly responsive, utility-first styling.
- **Recharts** for interactive data visualization and reporting.
- **Lucide React** for beautiful, consistent iconography.

### Backend
- **Node.js** & **Express** for a robust, scalable REST API.
- **SQLite (better-sqlite3)** for high-performance, lightweight persistent storage.
- **JWT (JSON Web Tokens)** & **Bcrypt** for secure user authentication and password hashing.

## 📦 Project Structure

```text
Transops/
├── frontend/       # React frontend application
└── backend/        # Express backend server with SQLite
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aucxtix/dummy-trans.git
   cd dummy-trans
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Configure your .env file if needed
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open your browser and navigate to the local server address provided by Vite (usually `http://localhost:5173`).
