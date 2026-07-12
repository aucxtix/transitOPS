const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'transitops.db');
const db = new Database(dbPath, { verbose: console.log });

const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      name_model TEXT NOT NULL,
      type TEXT NOT NULL,
      max_load_capacity REAL NOT NULL,
      odometer REAL DEFAULT 0,
      acquisition_cost REAL NOT NULL,
      status TEXT CHECK(status IN ('Available', 'On Trip', 'In Shop', 'Retired')) DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS Drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_category TEXT NOT NULL,
      license_expiry_date DATE NOT NULL,
      contact_number TEXT NOT NULL,
      safety_score REAL DEFAULT 100,
      status TEXT CHECK(status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')) DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS Trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      cargo_weight REAL NOT NULL,
      planned_distance REAL NOT NULL,
      actual_distance REAL,
      fuel_consumed REAL,
      status TEXT CHECK(status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')) DEFAULT 'Draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES Drivers(id)
    );

    CREATE TABLE IF NOT EXISTS MaintenanceLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      cost REAL NOT NULL,
      status TEXT CHECK(status IN ('Open', 'Closed')) DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS FuelLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      liters REAL NOT NULL,
      cost REAL NOT NULL,
      date DATE NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS Expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id)
    );
  `);
};

module.exports = { db, initDB };
