const bcrypt = require('bcrypt');
const { db, initDB } = require('./database');

async function seed() {
  initDB();

  console.log('Clearing existing data...');
  db.exec('DELETE FROM Trips');
  db.exec('DELETE FROM MaintenanceLogs');
  db.exec('DELETE FROM FuelLogs');
  db.exec('DELETE FROM Expenses');
  db.exec('DELETE FROM Vehicles');
  db.exec('DELETE FROM Drivers');
  db.exec('DELETE FROM Users');

  console.log('Seeding data...');
  
  // Seed User
  const passwordHash = await bcrypt.hash('password123', 10);
  const insertUser = db.prepare('INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  insertUser.run('Admin', 'admin@transitops.com', passwordHash, 'Fleet Manager');

  // Seed Vehicle 'Van-05' with 500kg capacity
  const insertVehicle = db.prepare('INSERT INTO Vehicles (registration_number, name_model, type, max_load_capacity, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?)');
  insertVehicle.run('Van-05', 'Ford Transit', 'Van', 500, 35000, 'Available');
  
  // Additional vehicles for testing dropdowns etc.
  insertVehicle.run('Truck-01', 'Volvo FH', 'Truck', 5000, 120000, 'Available');
  insertVehicle.run('Van-06', 'Mercedes Sprinter', 'Van', 600, 40000, 'In Shop');
  insertVehicle.run('Van-07', 'VW Crafter', 'Van', 800, 42000, 'Retired');

  // Seed Driver 'Alex' with non-expired license
  const insertDriver = db.prepare('INSERT INTO Drivers (name, license_number, license_category, license_expiry_date, contact_number, status) VALUES (?, ?, ?, ?, ?, ?)');
  // set expiry date to next year
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  insertDriver.run('Alex', 'DL-12345', 'Class B', nextYear.toISOString().split('T')[0], '555-0101', 'Available');

  // Additional drivers
  const pastYear = new Date();
  pastYear.setFullYear(pastYear.getFullYear() - 1);
  insertDriver.run('Sam', 'DL-99999', 'Class A', pastYear.toISOString().split('T')[0], '555-0102', 'Available'); // Expired
  insertDriver.run('Taylor', 'DL-88888', 'Class B', nextYear.toISOString().split('T')[0], '555-0103', 'Suspended');

  console.log('Database seeded successfully!');
}

seed().catch(console.error);
