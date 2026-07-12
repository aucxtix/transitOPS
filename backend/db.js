import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'transitops.db');

const db = new Database(dbPath, { verbose: null });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles (id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      name_model TEXT NOT NULL,
      type TEXT NOT NULL,
      max_load_capacity REAL NOT NULL,
      odometer REAL NOT NULL DEFAULT 0,
      acquisition_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available',
      region TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_category TEXT NOT NULL,
      license_expiry_date DATE NOT NULL,
      contact_number TEXT NOT NULL,
      safety_score REAL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'Available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      cargo_weight REAL NOT NULL,
      planned_distance REAL NOT NULL,
      actual_distance REAL,
      fuel_consumed REAL,
      status TEXT NOT NULL DEFAULT 'Pending',
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
      FOREIGN KEY (driver_id) REFERENCES drivers (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      maintenance_name TEXT NOT NULL,
      description TEXT NOT NULL,
      cost REAL,
      status TEXT NOT NULL DEFAULT 'Open',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      trip_id INTEGER,
      liters REAL NOT NULL,
      cost REAL NOT NULL,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      type TEXT NOT NULL,
      quantity REAL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      status TEXT DEFAULT 'Paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);
    CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips (vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips (driver_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_logs_vehicle_id ON maintenance_logs (vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs (vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_trip_id ON fuel_logs (trip_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses (vehicle_id);
  `);
}

export default db;
