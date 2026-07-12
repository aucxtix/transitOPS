import db, { initDb } from './db.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  console.log('Initializing database...');
  initDb();
  
  console.log('Clearing old data...');
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM expenses;
    DELETE FROM fuel_logs;
    DELETE FROM maintenance_logs;
    DELETE FROM trips;
    DELETE FROM drivers;
    DELETE FROM vehicles;
    DELETE FROM users;
    DELETE FROM roles;
  `);

  console.log('Seeding roles...');
  const insertRole = db.prepare('INSERT INTO roles (id, name) VALUES (?, ?)');
  const roles = [
    { id: 1, name: 'Fleet Manager' },
    { id: 2, name: 'Dispatcher' },
    { id: 3, name: 'Safety Officer' },
    { id: 4, name: 'Financial Analyst' },
    { id: 5, name: 'Driver' }
  ];
  for (const role of roles) insertRole.run(role.id, role.name);

  console.log('Seeding users...');
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role_id) VALUES (?, ?, ?, ?, ?)');
  const users = [
    { id: 1, name: 'Fleet Manager', email: 'admin@transitops.com', pass: 'Admin@123', role: 1 },
    { id: 2, name: 'Dispatcher', email: 'dispatcher@transitops.com', pass: 'Dispatch@123', role: 2 },
    { id: 3, name: 'Safety Officer', email: 'safety@transitops.com', pass: 'Safety@123', role: 3 },
    { id: 4, name: 'Financial Analyst', email: 'finance@transitops.com', pass: 'Finance@123', role: 4 },
    { id: 5, name: 'Alex Driver', email: 'alex@transitops.com', pass: 'Driver@123', role: 5 }
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.pass, 10);
    insertUser.run(u.id, u.name, u.email, hash, u.role);
  }

  console.log('Seeding vehicles...');
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status, region)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const vehicles = [
    { id: 1, reg: 'MH-01-AB-1234', name: 'Volvo FH16', type: 'Heavy Truck', cap: 25000, odo: 120000, cost: 85000, status: 'Available', region: 'West' },
    { id: 2, reg: 'DL-04-CD-5678', name: 'Tata Signa', type: 'Medium Truck', cap: 15000, odo: 85000, cost: 45000, status: 'On Trip', region: 'North' },
    { id: 3, reg: 'KA-05-EF-9012', name: 'Ashok Leyland Dost', type: 'Light Truck', cap: 2500, odo: 35000, cost: 12000, status: 'In Shop', region: 'South' },
    { id: 4, reg: 'GJ-01-GH-3456', name: 'Mahindra Bolero Pickup', type: 'Pickup', cap: 1500, odo: 54000, cost: 9500, status: 'Available', region: 'West' },
    { id: 5, reg: 'TN-09-IJ-7890', name: 'Van-05', type: 'Van', cap: 500, odo: 12000, cost: 6500, status: 'Available', region: 'South' }
  ];
  for (const v of vehicles) insertVehicle.run(v.id, v.reg, v.name, v.type, v.cap, v.odo, v.cost, v.status, v.region);

  console.log('Seeding drivers...');
  const insertDriver = db.prepare(`
    INSERT INTO drivers (id, user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const drivers = [
    { id: 1, user_id: 5, name: 'Alex', license: 'LIC-1001', cat: 'Heavy', exp: '2028-12-31', contact: '555-0101', score: 98, status: 'Available' },
    { id: 2, user_id: null, name: 'Sarah Connor', license: 'LIC-1002', cat: 'Medium', exp: '2027-05-15', contact: '555-0102', score: 85, status: 'On Trip' },
    { id: 3, user_id: null, name: 'John Doe', license: 'LIC-1003', cat: 'Light', exp: '2024-11-30', contact: '555-0103', score: 70, status: 'Suspended' },
    { id: 4, user_id: null, name: 'Jane Smith', license: 'LIC-1004', cat: 'All', exp: '2026-08-20', contact: '555-0104', score: 92, status: 'Available' }
  ];
  for (const d of drivers) insertDriver.run(d.id, d.user_id, d.name, d.license, d.cat, d.exp, d.contact, d.score, d.status);

  console.log('Seeding trips and logs...');
  // 2 completed trips
  const insertTrip = db.prepare(`
    INSERT INTO trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTrip.run(1, 'Mumbai', 'Pune', 1, 1, 15000, 150, 155, 40, 'Completed', 1);
  insertTrip.run(2, 'Delhi', 'Jaipur', 4, 4, 1000, 280, 290, 25, 'Completed', 1);

  // 1 Active trip
  insertTrip.run(3, 'Bangalore', 'Chennai', 2, 2, 12000, 350, null, null, 'On Trip', 2);
  
  // Fuel Logs
  db.prepare('INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date) VALUES (?, ?, ?, ?, ?)').run(1, 1, 40, 3800, '2026-07-10');
  db.prepare('INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date) VALUES (?, ?, ?, ?, ?)').run(4, 2, 25, 2375, '2026-07-11');
  
  // Expenses
  db.prepare('INSERT INTO expenses (vehicle_id, type, amount, date, status) VALUES (?, ?, ?, ?, ?)').run(1, 'Toll', 500, '2026-07-10', 'Paid');
  db.prepare('INSERT INTO expenses (vehicle_id, type, amount, date, status) VALUES (?, ?, ?, ?, ?)').run(4, 'Toll', 350, '2026-07-11', 'Paid');

  // Maintenance
  db.prepare('INSERT INTO maintenance_logs (vehicle_id, maintenance_name, description, status, notes) VALUES (?, ?, ?, ?, ?)').run(3, 'Engine Tune-up', 'Routine check and oil change', 'Open', 'Waiting for parts');

  console.log('Seed complete!');
};

seed().catch(console.error);
